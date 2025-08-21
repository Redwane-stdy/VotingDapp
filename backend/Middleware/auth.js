import jwt from 'jsonwebtoken';
import { config } from '../Utils/config.js';
import { logger } from '../Utils/logger.js';

export const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, config.JWT.SECRET);
    
    // Ajouter les informations utilisateur à la requête
    req.user = {
      walletAddress: decoded.walletAddress,
      timestamp: decoded.timestamp
    };

    logger.debug('User authenticated via middleware', { 
      walletAddress: decoded.walletAddress 
    });

    next();

  } catch (error) {
    logger.warn('Authentication failed', { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export default authMiddleware;