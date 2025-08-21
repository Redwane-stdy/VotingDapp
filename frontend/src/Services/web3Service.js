import { ethers } from 'ethers';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
  }

  // Vérifier si MetaMask est disponible
  isMetaMaskAvailable() {
    return typeof window.ethereum !== 'undefined';
  }

  // Connecter MetaMask
  async connectWallet() {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Demander la connexion à MetaMask
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Créer le provider et signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();
      
      // Récupérer le chain ID
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId.toString();
      
      // Écouter les changements de compte
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      return {
        account: this.account,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('Failed to connect wallet: ' + error.message);
    }
  }

  // Déconnecter le wallet
  async disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    
    // Retirer les listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
  }

  // Gérer le changement de compte
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // L'utilisateur a déconnecté son wallet
      this.disconnectWallet();
      window.location.reload();
    } else if (accounts[0] !== this.account) {
      // L'utilisateur a changé de compte
      window.location.reload();
    }
  }

  // Gérer le changement de réseau
  handleChainChanged(chainId) {
    // Recharger la page pour éviter les problèmes de state
    window.location.reload();
  }

  // Vérifier si le wallet est connecté
  async isConnected() {
    if (!this.isMetaMaskAvailable()) return false;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  // Récupérer le compte actuel
  async getCurrentAccount() {
    if (!this.account && await this.isConnected()) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      this.account = await signer.getAddress();
    }
    return this.account;
  }

  // Signer un message
  async signMessage(message) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message: ' + error.message);
    }
  }

  // Changer de réseau
  async switchNetwork(chainId) {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toQuantity(chainId) }],
      });
    } catch (switchError) {
      // Si le réseau n'existe pas, l'ajouter
      if (switchError.code === 4902) {
        await this.addNetwork(chainId);
      } else {
        throw switchError;
      }
    }
  }

  // Ajouter un réseau personnalisé
  async addNetwork(chainId) {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available');
    }

    // Configuration pour le réseau local Hardhat
    if (chainId === 31337 || chainId === '31337') {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7a69', // 31337 en hex
              chainName: 'Hardhat Local',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://127.0.0.1:8545'],
              blockExplorerUrls: null,
            },
          ],
        });
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw new Error('Failed to add network: ' + addError.message);
      }
    }
  }

  // Récupérer le solde d'un compte
  async getBalance(address = null) {
    if (!this.provider) {
      throw new Error('Provider not available');
    }

    const targetAddress = address || this.account;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    try {
      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get balance: ' + error.message);
    }
  }

  // Récupérer les informations du réseau
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not available');
    }

    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: network.chainId.toString(),
        name: network.name
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      throw new Error('Failed to get network info: ' + error.message);
    }
  }

  // Getters
  getProvider() {
    return this.provider;
  }

  getSigner() {
    return this.signer;
  }

  getAccount() {
    return this.account;
  }

  getChainId() {
    return this.chainId;
  }
}

// Instance singleton
const web3Service = new Web3Service();

export default web3Service;