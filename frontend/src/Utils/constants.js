// Configuration de l'application
export const APP_CONFIG = {
    NAME: process.env.REACT_APP_NAME || 'VotingDapp',
    VERSION: '1.0.0',
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    RPC_URL: process.env.REACT_APP_RPC_URL || 'http://127.0.0.1:8545',
    NETWORK_ID: process.env.REACT_APP_NETWORK_ID || '31337',
    ENV: process.env.REACT_APP_ENV || 'development'
  };
  
  // Configuration des réseaux
  export const NETWORKS = {
    31337: {
      chainId: '0x7a69',
      name: 'Hardhat Local',
      rpcUrl: 'http://127.0.0.1:8545',
      symbol: 'ETH',
      decimals: 18,
      blockExplorerUrl: null
    },
    1: {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/',
      symbol: 'ETH',
      decimals: 18,
      blockExplorerUrl: 'https://etherscan.io'
    },
    5: {
      chainId: '0x5',
      name: 'Goerli Testnet',
      rpcUrl: 'https://goerli.infura.io/v3/',
      symbol: 'ETH',
      decimals: 18,
      blockExplorerUrl: 'https://goerli.etherscan.io'
    }
  };
  
  // Messages d'erreur
  export const ERROR_MESSAGES = {
    WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
    WALLET_NOT_INSTALLED: 'MetaMask is not installed. Please install MetaMask to use this application.',
    WRONG_NETWORK: 'Please switch to the correct network',
    TRANSACTION_REJECTED: 'Transaction was rejected by user',
    INSUFFICIENT_FUNDS: 'Insufficient funds for transaction fees',
    GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
    AUTH_REQUIRED: 'Authentication required. Please connect your wallet and sign the message.',
    NOT_REGISTERED: 'You are not registered to vote',
    ALREADY_VOTED: 'You have already voted',
    VOTING_NOT_ACTIVE: 'Voting is not currently active',
    ADMIN_REQUIRED: 'Admin privileges required',
    INVALID_CANDIDATE: 'Invalid candidate selection',
    NETWORK_ERROR: 'Network error. Please check your connection.'
  };
  
  // Messages de succès
  export const SUCCESS_MESSAGES = {
    WALLET_CONNECTED: 'Wallet connected successfully',
    VOTE_CAST: 'Vote cast successfully',
    CANDIDATE_ADDED: 'Candidate added successfully',
    VOTER_REGISTERED: 'Voter registered successfully',
    VOTING_STARTED: 'Voting has been started',
    VOTING_STOPPED: 'Voting has been stopped',
    ELECTION_NAME_SET: 'Election name updated successfully',
    AUTHENTICATION_SUCCESS: 'Authentication successful'
  };
  
  // États de l'application
  export const APP_STATES = {
    LOADING: 'loading',
    IDLE: 'idle',
    ERROR: 'error',
    SUCCESS: 'success'
  };
  
  // États du vote
  export const VOTING_STATES = {
    NOT_STARTED: 'not_started',
    ACTIVE: 'active',
    ENDED: 'ended'
  };
  
  // Rôles utilisateur
  export const USER_ROLES = {
    VOTER: 'voter',
    ADMIN: 'admin'
  };
  
  // Constantes UI
  export const UI_CONSTANTS = {
    ITEMS_PER_PAGE: 10,
    TOAST_DURATION: 4000,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    REFRESH_INTERVAL: 30000 // 30 secondes
  };
  
  // Routes de l'application
  export const ROUTES = {
    HOME: '/',
    VOTE: '/vote',
    RESULTS: '/results',
    ADMIN: '/admin',
    NOT_FOUND: '/404'
  };
  
  // Couleurs du thème
  export const THEME_COLORS = {
    PRIMARY: '#3b82f6',
    SUCCESS: '#22c55e',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    INFO: '#06b6d4',
    DARK: '#1f2937',
    LIGHT: '#f9fafb'
  };
  
  // Configuration des animations
  export const ANIMATIONS = {
    FADE_IN: 'animate-fade-in',
    SLIDE_UP: 'animate-slide-up',
    BOUNCE_IN: 'animate-bounce-in',
    PULSE: 'animate-pulse',
    SPIN: 'animate-spin'
  };
  
  // Expressions régulières utiles
  export const REGEX = {
    ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ONLY_NUMBERS: /^\d+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/
  };
  
  // Configuration des timeouts
  export const TIMEOUTS = {
    API_REQUEST: 30000, // 30 secondes
    TRANSACTION_WAIT: 300000, // 5 minutes
    POLLING_INTERVAL: 5000 // 5 secondes
  };
  
  // Types d'événements
  export const EVENT_TYPES = {
    WALLET_CONNECTED: 'wallet_connected',
    WALLET_DISCONNECTED: 'wallet_disconnected',
    ACCOUNT_CHANGED: 'account_changed',
    NETWORK_CHANGED: 'network_changed',
    VOTE_CAST: 'vote_cast',
    CANDIDATE_ADDED: 'candidate_added',
    VOTER_REGISTERED: 'voter_registered',
    VOTING_STARTED: 'voting_started',
    VOTING_STOPPED: 'voting_stopped'
  };
  
  export default {
    APP_CONFIG,
    NETWORKS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    APP_STATES,
    VOTING_STATES,
    USER_ROLES,
    UI_CONSTANTS,
    ROUTES,
    THEME_COLORS,
    ANIMATIONS,
    REGEX,
    TIMEOUTS,
    EVENT_TYPES
  };