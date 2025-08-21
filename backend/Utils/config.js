import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonction pour lire les informations du contrat
function getContractInfo() {
  try {
    const contractInfoPath = join(__dirname, '../../shared/contract-info.json');
    const contractInfo = JSON.parse(readFileSync(contractInfoPath, 'utf8'));
    return contractInfo;
  } catch (error) {
    console.error('Erreur lors de la lecture du contract-info.json:', error.message);
    return null;
  }
}

const config = {
  // Configuration du serveur
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Configuration blockchain
  BLOCKCHAIN: {
    RPC_URL: process.env.RPC_URL || 'http://127.0.0.1:8545',
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    NETWORK_ID: process.env.NETWORK_ID || '31337' // Hardhat local
  },
  
  // Configuration JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Configuration CORS
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    CREDENTIALS: true
  },
  
  // Informations du contrat (chargées dynamiquement)
  CONTRACT: getContractInfo(),
  
  // Logs
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Export par défaut ET nommé pour compatibilité
export { config };
export default config;