import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './Utils/config.js';
import { logger } from './Utils/logger.js';

// Import des routes
import authRoutes from './Routes/auth.js';
import votingRoutes from './Routes/voting.js';
import adminRoutes from './Routes/admin.js';

const app = express();

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par fenêtre par IP
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de sécurité
app.use(helmet());
app.use(limiter);

// Configuration CORS
app.use(cors({
  origin: config.CORS.ORIGIN,
  credentials: config.CORS.CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging pour toutes les requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });
  next();
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    contract: config.CONTRACT ? {
      address: config.CONTRACT.address,
      network: config.CONTRACT.network
    } : null
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/admin', adminRoutes);

// Route pour obtenir les informations du contrat
app.get('/api/contract', (req, res) => {
  if (!config.CONTRACT) {
    return res.status(404).json({
      success: false,
      message: 'Contract information not found. Please deploy the contract first.'
    });
  }

  res.json({
    success: true,
    data: {
      address: config.CONTRACT.address,
      abi: config.CONTRACT.abi,
      network: config.CONTRACT.network,
      deployer: config.CONTRACT.deployer
    }
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(config.NODE_ENV === 'development' && { error: err.message })
  });
});

// Démarrage du serveur
const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: config.NODE_ENV,
    contract: config.CONTRACT?.address || 'Not deployed'
  });
});

// Gestion des signaux pour un arrêt propre
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;