import { ethers } from 'ethers';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;

    this.fallbackProvider = null;

    this.HARDHAT_CHAIN_ID = "31337"; // Hardhat local
    this.HARDHAT_RPC_URL = "http://127.0.0.1:8545";

    this.initializeFallbackProvider();
    this.setupEventListeners();
  }

  // Provider de fallback (Hardhat local)
  initializeFallbackProvider() {
    try {
      this.fallbackProvider = new ethers.JsonRpcProvider(this.HARDHAT_RPC_URL);
      console.log('✅ Fallback provider (Hardhat) initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize fallback provider:', error);
    }
  }

  getProvider() {
    if (this.provider && this.isConnected) return this.provider;
    if (this.fallbackProvider) return this.fallbackProvider;
    return null;
  }

  getSigner() {
    return this.signer;
  }

  isMetaMaskAvailable() {
    return typeof window !== 'undefined' && window.ethereum;
  }

  // 🔑 Connexion à MetaMask (et forcer Hardhat)
  async connectWallet() {
    try {
      if (!this.isMetaMaskAvailable()) {
        throw new Error('MetaMask is not installed. Please install MetaMask.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = accounts[0];

      const network = await this.provider.getNetwork();
      this.chainId = network.chainId.toString();

      // ⚠️ Vérifier si on est bien sur Hardhat (31337)
      if (this.chainId !== this.HARDHAT_CHAIN_ID) {
        console.warn(`⚠️ Wrong network: ${this.chainId}. Switching to Hardhat...`);
        await this.switchNetwork(this.HARDHAT_CHAIN_ID);
        this.chainId = this.HARDHAT_CHAIN_ID;
      }

      this.isConnected = true;

      console.log('✅ Wallet connected:', {
        account: this.account,
        chainId: this.chainId
      });

      return {
        account: this.account,
        chainId: this.chainId
      };

    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      throw error;
    }
  }

  async disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;

    console.log('Wallet disconnected');
  }

  async getBalance(address = null) {
    try {
      const provider = this.getProvider();
      if (!provider) throw new Error('Provider not available');

      const targetAddress = address || this.account;
      if (!targetAddress) throw new Error('No address provided and no connected account');

      const balance = await provider.getBalance(targetAddress);
      return ethers.formatEther(balance);

    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async getNetworkInfo() {
    try {
      const provider = this.getProvider();
      if (!provider) throw new Error('Provider not available');

      const network = await provider.getNetwork();
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        blockNumber: await provider.getBlockNumber()
      };

    } catch (error) {
      console.error('Error getting network info:', error);
      throw error;
    }
  }

  // 🔄 Forcer un switch réseau
  async switchNetwork(chainId) {
    if (!this.isMetaMaskAvailable()) throw new Error('MetaMask not available');
    const hexChainId = '0x' + parseInt(chainId).toString(16);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError) {
      // Si le réseau n’est pas ajouté dans MetaMask
      if (switchError.code === 4902) {
        console.log('Adding Hardhat network to MetaMask...');
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: hexChainId,
            chainName: "Hardhat Local",
            rpcUrls: [this.HARDHAT_RPC_URL],
            nativeCurrency: {
              name: "Hardhat ETH",
              symbol: "ETH",
              decimals: 18
            }
          }]
        });
      } else {
        console.error('Error switching network:', switchError);
        throw switchError;
      }
    }
  }

  setupEventListeners() {
    if (!this.isMetaMaskAvailable()) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else if (accounts[0] !== this.account) {
        this.account = accounts[0];
        if (this.provider) {
          this.provider.getSigner().then(signer => {
            this.signer = signer;
          });
        }
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      this.chainId = parseInt(chainId, 16).toString();
      if (this.chainId !== this.HARDHAT_CHAIN_ID) {
        console.warn(`⚠️ Not on Hardhat (31337). Currently on ${this.chainId}`);
      }
    });

    window.ethereum.on('connect', (connectInfo) => {
      console.log('MetaMask connected:', connectInfo);
    });

    window.ethereum.on('disconnect', (error) => {
      console.log('MetaMask disconnected:', error);
      this.disconnectWallet();
    });
  }

  async checkConnection() {
    if (!this.isMetaMaskAvailable()) return false;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length > 0) {
        await this.connectWallet();
        return true;
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }

    return false;
  }

  getAccount() {
    return this.account;
  }

  getIsConnected() {
    return this.isConnected;
  }

  getChainId() {
    return this.chainId;
  }

  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      chainId: this.chainId,
      hasMetaMask: this.isMetaMaskAvailable(),
      hasFallbackProvider: !!this.fallbackProvider
    };
  }
}

const web3Service = new Web3Service();
export default web3Service;
