import { ethers } from 'ethers';
import web3Service from './web3Service';

class ContractService {
  constructor() {
    this.contractInfo = null;
    this.initialized = false;
  }

  // Initialiser avec les infos du backend
  async initialize() {
    try {
      console.log('Initialisation du service contractuel...');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/contract`);
      console.log("API URL utilisée:", process.env.REACT_APP_API_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch contract info: ${response.status} ${response.statusText}`);
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

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Création d'une instance du contrat
  async getContract(needSigner = false) {
    await this.ensureInitialized();

    const provider = web3Service.getProvider();
    if (!provider) {
      throw new Error('No provider available. Please check your Hardhat node or connect MetaMask.');
    }

    let providerOrSigner = provider;

    if (needSigner) {
      const signer = web3Service.getSigner();
      if (!signer) {
        if (!web3Service.isMetaMaskAvailable()) {
          throw new Error('MetaMask not installed. Please install MetaMask.');
        } else if (!web3Service.isConnected) {
          throw new Error('Wallet not connected. Please connect MetaMask.');
        } else {
          throw new Error('Signer not available. Please reconnect your wallet.');
        }
      }
      providerOrSigner = signer;
    }

    console.log(`Creating contract instance with ${needSigner ? 'signer' : 'provider'}`, {
      address: this.contractInfo.address,
      needSigner
    });

    return new ethers.Contract(
      this.contractInfo.address,
      this.contractInfo.abi,
      providerOrSigner
    );
  }

  // -----------------------------
  // MÉTHODES DE LECTURE (provider)
  // -----------------------------

  async getElectionName() {
    const contract = await this.getContract(false);
    return await contract.electionName();
  }

  async isVotingActive() {
    const contract = await this.getContract(false);
    return await contract.votingActive();
  }

  async getTotalVotes() {
    const contract = await this.getContract(false);
    return (await contract.totalVotes()).toString();
  }

  // AMÉLIORÉE: Utilise getAllCandidatesDetails pour une seule call
  async getAllCandidates() {
    try {
      const contract = await this.getContract(false);
      
      // Vérifier si la nouvelle fonction existe
      if (contract.getAllCandidatesDetails) {
        const result = await contract.getAllCandidatesDetails();
        const candidates = [];
        
        for (let i = 0; i < result.ids.length; i++) {
          candidates.push({
            id: result.ids[i].toString(),
            name: result.names[i],
            description: result.descriptions[i],
            voteCount: result.voteCounts[i].toString()
          });
        }
        
        return candidates;
      } else {
        // Fallback pour l'ancienne méthode
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
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  }

  async getOwner() {
    try {
      const contract = await this.getContract(false);
      return await contract.owner();
    } catch (error) {
      console.error('Erreur getOwner:', error);
      throw error;
    }
  }

  // CORRIGÉE: Convertit en nombre et mappe aux phases
  async getCurrentWorkflowStatus() {
    try {
      const contract = await this.getContract(false);
      const status = await contract.workflowStatus();
      const statusNumber = parseInt(status);
      
      // Mapping des statuts numériques vers les noms
      const statusMap = {
        0: 'Registration',
        1: 'Voting', 
        2: 'Ended'
      };
      
      return statusMap[statusNumber] || 'Unknown';
    } catch (error) {
      console.error('Erreur getCurrentWorkflowStatus:', error);
      throw error;
    }
  }

  async getCandidate(candidateId) {
    const contract = await this.getContract(false);
    const [id, name, description, voteCount] = await contract.getCandidate(candidateId);
    return {
      id: id.toString(),
      name,
      description,
      voteCount: voteCount.toString()
    };
  }

  async getVoterInfo(address) {
    const contract = await this.getContract(false);
    const [isRegistered, hasVoted, votedFor] = await contract.getVoterInfo(address);
    return {
      isRegistered,
      hasVoted,
      votedFor: votedFor.toString()
    };
  }

  async getResults() {
    const contract = await this.getContract(false);
    const [ids, names, voteCounts] = await contract.getResults();

    const results = ids.map((id, i) => ({
      id: id.toString(),
      name: names[i],
      voteCount: voteCounts[i].toString()
    }));

    return results.sort((a, b) => parseInt(b.voteCount) - parseInt(a.voteCount));
  }

  async getWinner() {
    const contract = await this.getContract(false);
    const [winnerId, winnerName, winnerVotes] = await contract.getWinner();
    return {
      id: winnerId.toString(),
      name: winnerName,
      voteCount: winnerVotes.toString()
    };
  }

  async isAdmin(address) {
    const contract = await this.getContract(false);
    const adminAddress = await contract.admin();
    return adminAddress.toLowerCase() === address.toLowerCase();
  }

  // -----------------------------
  // MÉTHODES D'ÉCRITURE (signer)
  // -----------------------------

  async vote(candidateId) {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.vote.estimateGas(candidateId);
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.vote(candidateId, { gasLimit });
      return await tx.wait();
    } catch (error) {
      this.handleContractError(error);
    }
  }

  // CORRIGÉE: Méthode compatible avec AdminPanel
  async addCandidate(name, description, fromAddress) {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.addCandidate.estimateGas(name, description);
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.addCandidate(name, description, { gasLimit });
      return await tx.wait();
    } catch (error) {
      this.handleContractError(error);
    }
  }

  async registerVoter(voterAddress) {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.registerVoter.estimateGas(voterAddress);
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.registerVoter(voterAddress, { gasLimit });
      return await tx.wait();
    } catch (error) {
      this.handleContractError(error);
    }
  }

  async registerMultipleVoters(voterAddresses) {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.registerMultipleVoters.estimateGas(voterAddresses);
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.registerMultipleVoters(voterAddresses, { gasLimit });
      return await tx.wait();
    } catch (error) {
      this.handleContractError(error);
    }
  }

  // CORRIGÉE: Méthode compatible avec AdminPanel
  async startVoting(fromAddress) {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.startVoting.estimateGas();
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.startVoting({ gasLimit });
      return await tx.wait();
    } catch (error) {
      this.handleContractError(error);
    }
  }

  // CORRIGÉE: Méthode compatible avec AdminPanel (alias pour endVoting)
  async endVoting(fromAddress) {
    return this.stopVoting();
  }

  async stopVoting() {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.stopVoting.estimateGas();
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.stopVoting({ gasLimit });
      return await tx.wait();
    } catch (error) {
      this.handleContractError(error);
    }
  }

  async setElectionName(name) {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.setElectionName.estimateGas(name);
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.setElectionName(name, { gasLimit });
      return await tx.wait();
    } catch (error) {
      this.handleContractError(error);
    }
  }

  // NOUVELLE: Fonction de reset pour le développement
  async resetContract() {
    try {
      const contract = await this.getContract(true);
      const gasEstimate = await contract.resetContract.estimateGas();
      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.resetContract({ gasLimit });
      return await tx.wait();
    } catch (error) {
      console.error('Error resetting contract:', error);
      this.handleContractError(error);
    }
  }

  // -----------------------------
  // UTILS
  // -----------------------------

  async waitForTransaction(tx, confirmations = 1) {
    console.log(`Waiting for transaction ${tx.hash}...`);
    return await tx.wait(confirmations);
  }

  // AMÉLIORÉE: Gestion d'erreur plus robuste
  handleContractError(error) {
    console.error('Contract error:', error);
    
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('Transaction would fail. Check conditions.');
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for gas fees.');
    }
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('User rejected the transaction');
    }
    if (error.message?.includes('user rejected transaction')) {
      throw new Error('User rejected');
    }
    if (error.message?.includes('Voting is already active')) {
      throw new Error('Voting is already active');
    }
    if (error.message?.includes('Cannot add candidates during active voting')) {
      throw new Error('Registration phase ended');
    }
    if (error.message?.includes('Voting is not active')) {
      throw new Error('Voting not started');
    }
    if (error.reason) {
      throw new Error(error.reason);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Unknown contract error.');
  }

  getContractInfo() {
    return this.contractInfo;
  }

  isInitialized() {
    return this.initialized;
  }
}

const contractService = new ContractService();
export default contractService;