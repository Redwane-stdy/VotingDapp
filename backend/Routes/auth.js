import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../Utils/config.js';
import { logger } from '../Utils/logger.js';

const router = express.Router();

// Route de connexion/authentification
router.post('/login', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address, signature, and message are required'
      });
    }

    // TODO: Vérifier la signature avec ethers
    // Pour le moment, on fait une authentification simple
    
    // Générer un token JWT
    const token = jwt.sign(
      { 
        walletAddress: walletAddress.toLowerCase(),
        timestamp: Date.now()
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );

    logger.info('User authenticated', { walletAddress });

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        walletAddress: walletAddress.toLowerCase()
      }
    });

  } catch (error) {
    logger.error('Authentication error', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});

// Route pour vérifier le token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT.SECRET);
    res.json({
      success: true,
      message: 'Token valid',
      user: {
        walletAddress: decoded.walletAddress
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Route de déconnexion (côté client principalement)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;