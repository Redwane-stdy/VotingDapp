import axios from 'axios';
import web3Service from './web3Service';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('voting_token');
    this.user = null;
    
    // Configurer axios
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Intercepteur pour ajouter le token aux requêtes
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs d'auth
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // Générer un message de connexion
  generateLoginMessage(address, nonce, timestamp) {
    return `Login to VotingDapp\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  }

  // Authentification avec signature
  async authenticateWithSignature() {
    try {
      // Vérifier que le wallet est connecté
      const account = await web3Service.getCurrentAccount();
      if (!account) {
        throw new Error('Please connect your wallet first');
      }

      // Générer les données pour le message
      const nonce = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now();
      const message = this.generateLoginMessage(account, nonce, timestamp);

      // Demander la signature
      const signature = await web3Service.signMessage(message);

      // Envoyer au backend pour vérification
      const response = await this.api.post('/auth/login', {
        walletAddress: account,
        signature,
        message,
        nonce,
        timestamp
      });

      if (response.data.success) {
        this.token = response.data.token;
        this.user = response.data.user;
        
        // Sauvegarder le token
        localStorage.setItem('voting_token', this.token);
        
        console.log('Authentication successful:', this.user);
        return { success: true, user: this.user };
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Authentication failed');
    }
  }

  // Vérifier si l'utilisateur est authentifié
  async verifyToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.api.get('/auth/verify');
      
      if (response.data.success) {
        this.user = response.data.user;
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      this.logout();
      return false;
    }
  }

  // Déconnexion
  async logout() {
    try {
      if (this.token) {
        await this.api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Nettoyer les données locales
      this.token = null;
      this.user = null;
      localStorage.removeItem('voting_token');
      
      // Déconnecter le wallet
      await web3Service.disconnectWallet();
    }
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser() {
    return this.user;
  }

  // Récupérer le token
  getToken() {
    return this.token;
  }

  // API calls avec authentification
  async apiCall(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: endpoint,
        ...(data && { data })
      };

      const response = await this.api(config);
      return response.data;
    } catch (error) {
      console.error(`API call failed (${method} ${endpoint}):`, error);
      throw new Error(error.response?.data?.message || error.message || 'API call failed');
    }
  }

  // Méthodes spécifiques pour les votes
  async getCandidates() {
    return this.apiCall('get', '/voting/candidates');
  }

  async getVotingInfo() {
    return this.apiCall('get', '/voting/info');
  }

  async vote(candidateId) {
    return this.apiCall('post', '/voting/vote', { candidateId });
  }

  async getResults() {
    return this.apiCall('get', '/voting/results');
  }

  async getVoterStatus(address) {
    return this.apiCall('get', `/voting/voter-status/${address}`);
  }

  // Méthodes d'administration
  async addCandidate(name, description) {
    return this.apiCall('post', '/admin/candidates', { name, description });
  }

  async registerVoter(voterAddress) {
    return this.apiCall('post', '/admin/voters', { voterAddress });
  }

  async registerMultipleVoters(voterAddresses) {
    return this.apiCall('post', '/admin/voters/bulk', { voterAddresses });
  }

  async startVoting() {
    return this.apiCall('post', '/admin/voting/start');
  }

  async stopVoting() {
    return this.apiCall('post', '/admin/voting/stop');
  }

  async setElectionName(name) {
    return this.apiCall('put', '/admin/election/name', { name });
  }
}

// Instance singleton
const authService = new AuthService();

export default authService;