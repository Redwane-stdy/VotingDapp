import { blockchainService } from './blockchainService.js';
import { logger } from '../Utils/logger.js';

class VotingService {
  // Méthodes de lecture
  async getAllCandidates() {
    try {
      const contract = await blockchainService.getContract();
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
          logger.warn(`Error fetching candidate ${id}`, error);
        }
      }
      
      return candidates;
    } catch (error) {
      logger.error('Error getting all candidates', error);
      throw error;
    }
  }

  async getCandidate(candidateId) {
    try {
      const contract = await blockchainService.getContract();
      const [id, name, description, voteCount] = await contract.getCandidate(candidateId);
      
      return {
        id: id.toString(),
        name,
        description,
        voteCount: voteCount.toString()
      };
    } catch (error) {
      logger.error(`Error getting candidate ${candidateId}`, error);
      throw error;
    }
  }

  async getVotingInfo() {
    try {
      const contract = await blockchainService.getContract();
      
      const [electionName, votingActive, totalVotes, candidateCount] = await Promise.all([
        contract.electionName(),
        contract.votingActive(),
        contract.totalVotes(),
        contract.getCandidateCount()
      ]);

      return {
        electionName,
        votingActive,
        totalVotes: totalVotes.toString(),
        candidateCount: candidateCount.toString()
      };
    } catch (error) {
      logger.error('Error getting voting info', error);
      throw error;
    }
  }

  async getVoterStatus(address) {
    try {
      const contract = await blockchainService.getContract();
      const [isRegistered, hasVoted, votedFor] = await contract.getVoterInfo(address);
      
      return {
        isRegistered,
        hasVoted,
        votedFor: votedFor.toString()
      };
    } catch (error) {
      logger.error(`Error getting voter status for ${address}`, error);
      throw error;
    }
  }

  async getResults() {
    try {
      const contract = await blockchainService.getContract();
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
      logger.error('Error getting results', error);
      throw error;
    }
  }

  async getWinner() {
    try {
      const contract = await blockchainService.getContract();
      const [winnerId, winnerName, winnerVotes] = await contract.getWinner();
      
      return {
        id: winnerId.toString(),
        name: winnerName,
        voteCount: winnerVotes.toString()
      };
    } catch (error) {
      logger.error('Error getting winner', error);
      throw error;
    }
  }

  // Méthodes d'écriture (nécessitent un signer)
  async addCandidate(name, description) {
    try {
      const contract = await blockchainService.getContract();
      const signer = await blockchainService.getSigner();
      
      const tx = await contract.connect(signer).addCandidate(name, description);
      const receipt = await tx.wait();
      
      logger.info('Candidate added', { name, description, txHash: tx.hash });
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      blockchainService.handleTransactionError(error);
    }
  }

  async registerVoter(voterAddress) {
    try {
      const contract = await blockchainService.getContract();
      const signer = await blockchainService.getSigner();
      
      const tx = await contract.connect(signer).registerVoter(voterAddress);
      const receipt = await tx.wait();
      
      logger.info('Voter registered', { voterAddress, txHash: tx.hash });
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      blockchainService.handleTransactionError(error);
    }
  }

  async registerMultipleVoters(voterAddresses) {
    try {
      const contract = await blockchainService.getContract();
      const signer = await blockchainService.getSigner();
      
      const tx = await contract.connect(signer).registerMultipleVoters(voterAddresses);
      const receipt = await tx.wait();
      
      logger.info('Multiple voters registered', { 
        count: voterAddresses.length, 
        txHash: tx.hash 
      });
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        votersCount: voterAddresses.length
      };
    } catch (error) {
      blockchainService.handleTransactionError(error);
    }
  }

  async vote(voterAddress, candidateId) {
    try {
      const contract = await blockchainService.getContract();
      
      // Utiliser l'adresse du votant comme signer si possible
      // Sinon utiliser le signer par défaut (pour les tests)
      const signer = await blockchainService.getSigner();
      
      const tx = await contract.connect(signer).vote(candidateId);
      const receipt = await tx.wait();
      
      logger.info('Vote cast', { voterAddress, candidateId, txHash: tx.hash });
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      blockchainService.handleTransactionError(error);
    }
  }

  async startVoting() {
    try {
      const contract = await blockchainService.getContract();
      const signer = await blockchainService.getSigner();
      
      const tx = await contract.connect(signer).startVoting();
      const receipt = await tx.wait();
      
      logger.info('Voting started', { txHash: tx.hash });
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      blockchainService.handleTransactionError(error);
    }
  }

  async stopVoting() {
    try {
      const contract = await blockchainService.getContract();
      const signer = await blockchainService.getSigner();
      
      const tx = await contract.connect(signer).stopVoting();
      const receipt = await tx.wait();
      
      logger.info('Voting stopped', { txHash: tx.hash });
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      blockchainService.handleTransactionError(error);
    }
  }

  async setElectionName(name) {
    try {
      const contract = await blockchainService.getContract();
      const signer = await blockchainService.getSigner();
      
      const tx = await contract.connect(signer).setElectionName(name);
      const receipt = await tx.wait();
      
      logger.info('Election name set', { name, txHash: tx.hash });
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      blockchainService.handleTransactionError(error);
    }
  }

  // Méthodes utilitaires
  async isAdmin(address) {
    return await blockchainService.isAdmin(address);
  }

  async isVotingActive() {
    return await blockchainService.isVotingActive();
  }

  async getTotalVotes() {
    const totalVotes = await blockchainService.getTotalVotes();
    return totalVotes.toString();
  }
}

// Instance singleton
const votingService = new VotingService();

export { votingService };
export default votingService;