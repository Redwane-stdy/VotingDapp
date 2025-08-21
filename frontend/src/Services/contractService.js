import { ethers } from 'ethers';
import web3Service from './web3Service';

class ContractService {
  constructor() {
    this.contract = null;
    this.contractInfo = null;
    this.initialized = false;
  }

  // Initialiser le service avec les informations du contrat
  async initialize() {
    try {
      // Récupérer les informations du contrat depuis le backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/contract`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract info from backend');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get contract info');
      }
      
      this.contractInfo = data.data;
      this.initialized = true;
      
      console.log('Contract service initialized:', this.contractInfo);
      return this.contractInfo;
      
    } catch (error) {
      console.error('Error initializing contract service:', error);
      throw error;
    }
  }

  // S'assurer que le service est initialisé
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Créer une instance du contrat
  async getContract(needSigner = false) {
    await this.ensureInitialized();
    
    const provider = web3Service.getProvider();
    if (!provider) {
      throw new Error('Web3 provider not available. Please connect your wallet.');
    }

    let providerOrSigner = provider;
    
    if (needSigner) {
      const signer = web3Service.getSigner();
      if (!signer) {
        throw new Error('Signer not available. Please connect your wallet.');
      }
      providerOrSigner = signer;
    }

    return new ethers.Contract(
      this.contractInfo.address,
      this.contractInfo.abi,
      providerOrSigner
    );
  }

  // Méthodes de lecture (ne nécessitent pas de signer)
  async getElectionName() {
    try {
      const contract = await this.getContract();
      return await contract.electionName();
    } catch (error) {
      console.error('Error getting election name:', error);
      throw error;
    }
  }

  async isVotingActive() {
    try {
      const contract = await this.getContract();
      return await contract.votingActive();
    } catch (error) {
      console.error('Error checking voting status:', error);
      throw error;
    }
  }

  async getTotalVotes() {
    try {
      const contract = await this.getContract();
      const total = await contract.totalVotes();
      return total.toString();
    } catch (error) {
      console.error('Error getting total votes:', error);
      throw error;
    }
  }

  async getAllCandidates() {
    try {
      const contract = await this.getContract();
      const candidateIds = await contract.getAllCandidates();
      
      const candidates = [];
      for (const id of candidateIds) {
        try {
          const [candidateId, name, description, voteCount] = await contract.getCandidate(id);
          candidates.push({
            id: candidateId.toString(),
            name,
            description,
            voteCount: voteCount.toString()
          });
        } catch (error) {
          console.warn(`Error fetching candidate ${id}:`, error);
        }
      }
      
      return candidates;
    } catch (error) {
      console.error('Error getting all candidates:', error);
      throw error;
    }
  }

  async getCandidate(candidateId) {
    try {
      const contract = await this.getContract();
      const [id, name, description, voteCount] = await contract.getCandidate(candidateId);
      
      return {
        id: id.toString(),
        name,
        description,
        voteCount: voteCount.toString()
      };
    } catch (error) {
      console.error(`Error getting candidate ${candidateId}:`, error);
      throw error;
    }
  }

  async getVoterInfo(address) {
    try {
      const contract = await this.getContract();
      const [isRegistered, hasVoted, votedFor] = await contract.getVoterInfo(address);
      
      return {
        isRegistered,
        hasVoted,
        votedFor: votedFor.toString()
      };
    } catch (error) {
      console.error(`Error getting voter info for ${address}:`, error);
      throw error;
    }
  }

  async getResults() {
    try {
      const contract = await this.getContract();
      const [ids, names, voteCounts] = await contract.getResults();
      
      const results = [];
      for (let i = 0; i < ids.length; i++) {
        results.push({
          id: ids[i].toString(),
          name: names[i],
          voteCount: voteCounts[i].toString()
        });
      }
      
      // Trier par nombre de votes (décroissant)
      results.sort((a, b) => parseInt(b.voteCount) - parseInt(a.voteCount));
      
      return results;
    } catch (error) {
      console.error('Error getting results:', error);
      throw error;
    }
  }

  async getWinner() {
    try {
      const contract = await this.getContract();
      const [winnerId, winnerName, winnerVotes] = await contract.getWinner();
      
      return {
        id: winnerId.toString(),
        name: winnerName,
        voteCount: winnerVotes.toString()
      };
    } catch (error) {
      console.error('Error getting winner:', error);
      throw error;
    }
  }

  async isAdmin(address) {
    try {
      const contract = await this.getContract();
      const adminAddress = await contract.admin();
      return adminAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error checking admin status:', error);
      throw error;
    }
  }

  // Méthodes d'écriture (nécessitent un signer et des frais de gas)
  async vote(candidateId) {
    try {
      const contract = await this.getContract(true);
      
      // Estimer le gas
      const gasEstimate = await contract.vote.estimateGas(candidateId);
      
      // Ajouter une marge de sécurité de 20%
      const gasLimit = gasEstimate * 120n / 100n;
      
      const tx = await contract.vote(candidateId, { gasLimit });
      
      console.log('Vote transaction sent:', tx.hash);
      return tx;
      
    } catch (error) {
      console.error('Error voting:', error);
      this.handleContractError(error);
    }
  }

  async addCandidate(name, description) {
    try {
      const contract = await this.getContract(true);
      
      const gasEstimate = await contract.addCandidate.estimateGas(name, description);
      const gasLimit = gasEstimate * 120n / 100n;
      
      const tx = await contract.addCandidate(name, description, { gasLimit });
      
      console.log('Add candidate transaction sent:', tx.hash);
      return tx;
      
    } catch (error) {
      console.error('Error adding candidate:', error);
      this.handleContractError(error);
    }
  }

  async registerVoter(voterAddress) {
    try {
      const contract = await this.getContract(true);
      
      const gasEstimate = await contract.registerVoter.estimateGas(voterAddress);
      const gasLimit = gasEstimate * 120n / 100n;
      
      const tx = await contract.registerVoter(voterAddress, { gasLimit });
      
      console.log('Register voter transaction sent:', tx.hash);
      return tx;
      
    } catch (error) {
      console.error('Error registering voter:', error);
      this.handleContractError(error);
    }
  }

  async registerMultipleVoters(voterAddresses) {
    try {
      const contract = await this.getContract(true);
      
      const gasEstimate = await contract.registerMultipleVoters.estimateGas(voterAddresses);
      const gasLimit = gasEstimate * 120n / 100n;
      
      const tx = await contract.registerMultipleVoters(voterAddresses, { gasLimit });
      
      console.log('Register multiple voters transaction sent:', tx.hash);
      return tx;
      
    } catch (error) {
      console.error('Error registering multiple voters:', error);
      this.handleContractError(error);
    }
  }

  async startVoting() {
    try {
      const contract = await this.getContract(true);
      
      const gasEstimate = await contract.startVoting.estimateGas();
      const gasLimit = gasEstimate * 120n / 100n;
      
      const tx = await contract.startVoting({ gasLimit });
      
      console.log('Start voting transaction sent:', tx.hash);
      return tx;
      
    } catch (error) {
      console.error('Error starting voting:', error);
      this.handleContractError(error);
    }
  }

  async stopVoting() {
    try {
      const contract = await this.getContract(true);
      
      const gasEstimate = await contract.stopVoting.estimateGas();
      const gasLimit = gasEstimate * 120n / 100n;
      
      const tx = await contract.stopVoting({ gasLimit });
      
      console.log('Stop voting transaction sent:', tx.hash);
      return tx;
      
    } catch (error) {
      console.error('Error stopping voting:', error);
      this.handleContractError(error);
    }
  }

  async setElectionName(name) {
    try {
      const contract = await this.getContract(true);
      
      const gasEstimate = await contract.setElectionName.estimateGas(name);
      const gasLimit = gasEstimate * 120n / 100n;
      
      const tx = await contract.setElectionName(name, { gasLimit });
      
      console.log('Set election name transaction sent:', tx.hash);
      return tx;
      
    } catch (error) {
      console.error('Error setting election name:', error);
      this.handleContractError(error);
    }
  }

  // Attendre la confirmation d'une transaction
  async waitForTransaction(tx, confirmations = 1) {
    try {
      console.log(`Waiting for transaction ${tx.hash} to be mined...`);
      const receipt = await tx.wait(confirmations);
      console.log(`Transaction ${tx.hash} confirmed in block ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  // Gérer les erreurs de contrat
  handleContractError(error) {
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('Transaction would fail. Please check the conditions and try again.');
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for transaction fees.');
    }
    
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction was rejected by user.');
    }
    
    if (error.reason) {
      throw new Error(error.reason);
    }
    
    if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error('An unknown error occurred during the transaction.');
  }

  // Getters
  getContractInfo() {
    return this.contractInfo;
  }

  isInitialized() {
    return this.initialized;
  }
}

// Instance singleton
const contractService = new ContractService();

export default contractService;