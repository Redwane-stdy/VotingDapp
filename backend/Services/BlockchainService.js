import { ethers } from 'ethers';
import { config } from '../Utils/config.js';
import { logger } from '../Utils/logger.js';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (!config.CONTRACT) {
        throw new Error('Contract information not found. Please deploy the contract first.');
      }

      // Connexion au provider
      this.provider = new ethers.JsonRpcProvider(config.BLOCKCHAIN.RPC_URL);
      
      // Test de connexion
      await this.provider.getNetwork();
      logger.info('Connected to blockchain', { 
        rpcUrl: config.BLOCKCHAIN.RPC_URL,
        networkId: config.BLOCKCHAIN.NETWORK_ID
      });

      // Configuration du signer si une clé privée est fournie
      if (config.BLOCKCHAIN.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(config.BLOCKCHAIN.PRIVATE_KEY, this.provider);
        logger.info('Signer initialized', { address: this.signer.address });
      }

      // Initialisation du contrat
      this.contract = new ethers.Contract(
        config.CONTRACT.address,
        config.CONTRACT.abi,
        this.signer || this.provider
      );

      // Test du contrat
      const admin = await this.contract.admin();
      logger.info('Contract connected', { 
        address: config.CONTRACT.address,
        admin
      });

      this.initialized = true;
      return true;

    } catch (error) {
      logger.error('Failed to initialize blockchain service', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async getContract() {
    await this.ensureInitialized();
    return this.contract;
  }

  async getProvider() {
    await this.ensureInitialized();
    return this.provider;
  }

  async getSigner() {
    await this.ensureInitialized();
    if (!this.signer) {
      throw new Error('No signer available. Private key not configured.');
    }
    return this.signer;
  }

  // Méthodes utilitaires
  async getBlockNumber() {
    await this.ensureInitialized();
    return await this.provider.getBlockNumber();
  }

  async getBalance(address) {
    await this.ensureInitialized();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getTransactionReceipt(txHash) {
    await this.ensureInitialized();
    return await this.provider.getTransactionReceipt(txHash);
  }

  async waitForTransaction(txHash, confirmations = 1) {
    await this.ensureInitialized();
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  // Méthodes de lecture du contrat
  async isAdmin(address) {
    const contract = await this.getContract();
    const admin = await contract.admin();
    return admin.toLowerCase() === address.toLowerCase();
  }

  async getElectionName() {
    const contract = await this.getContract();
    return await contract.electionName();
  }

  async isVotingActive() {
    const contract = await this.getContract();
    return await contract.votingActive();
  }

  async getTotalVotes() {
    const contract = await this.getContract();
    return await contract.totalVotes();
  }

  // Gestion d'erreurs pour les transactions
  handleTransactionError(error) {
    logger.error('Transaction error', error);
    
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('Transaction would fail. Please check the conditions.');
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for transaction.');
    }
    
    if (error.reason) {
      throw new Error(error.reason);
    }
    
    throw new Error('Transaction failed: ' + error.message);
  }
}

// Instance singleton
const blockchainService = new BlockchainService();

export { blockchainService };
export default blockchainService;