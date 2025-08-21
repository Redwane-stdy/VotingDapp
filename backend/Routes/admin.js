import express from 'express';
import { config } from '../Utils/config.js';
import { logger } from '../Utils/logger.js';
import { votingService } from '../Services/votingService.js';
import { authMiddleware } from '../Middleware/auth.js';

const router = express.Router();

// Middleware pour vérifier les droits admin
const adminMiddleware = async (req, res, next) => {
  try {
    const isAdmin = await votingService.isAdmin(req.user.walletAddress);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    logger.error('Admin middleware error', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin status'
    });
  }
};

// Utiliser authMiddleware et adminMiddleware pour toutes les routes admin
router.use(authMiddleware, adminMiddleware);

// Ajouter un candidat
router.post('/candidates', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required'
      });
    }

    const result = await votingService.addCandidate(name, description || '');
    
    logger.info('Candidate added', { name, description, admin: req.user.walletAddress });
    
    res.json({
      success: true,
      message: 'Candidate added successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error adding candidate', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add candidate',
      error: error.message
    });
  }
});

// Enregistrer un votant
router.post('/voters', async (req, res) => {
  try {
    const { voterAddress } = req.body;
    
    if (!voterAddress) {
      return res.status(400).json({
        success: false,
        message: 'Voter address is required'
      });
    }

    const result = await votingService.registerVoter(voterAddress);
    
    logger.info('Voter registered', { voterAddress, admin: req.user.walletAddress });
    
    res.json({
      success: true,
      message: 'Voter registered successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error registering voter', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register voter',
      error: error.message
    });
  }
});

// Enregistrer plusieurs votants
router.post('/voters/bulk', async (req, res) => {
  try {
    const { voterAddresses } = req.body;
    
    if (!Array.isArray(voterAddresses) || voterAddresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of voter addresses is required'
      });
    }

    const result = await votingService.registerMultipleVoters(voterAddresses);
    
    logger.info('Multiple voters registered', { 
      count: voterAddresses.length, 
      admin: req.user.walletAddress 
    });
    
    res.json({
      success: true,
      message: `${voterAddresses.length} voters registered successfully`,
      data: result
    });

  } catch (error) {
    logger.error('Error registering multiple voters', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register voters',
      error: error.message
    });
  }
});

// Démarrer le vote
router.post('/voting/start', async (req, res) => {
  try {
    const result = await votingService.startVoting();
    
    logger.info('Voting started', { admin: req.user.walletAddress });
    
    res.json({
      success: true,
      message: 'Voting started successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error starting voting', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start voting',
      error: error.message
    });
  }
});

// Arrêter le vote
router.post('/voting/stop', async (req, res) => {
  try {
    const result = await votingService.stopVoting();
    
    logger.info('Voting stopped', { admin: req.user.walletAddress });
    
    res.json({
      success: true,
      message: 'Voting stopped successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error stopping voting', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop voting',
      error: error.message
    });
  }
});

// Définir le nom de l'élection
router.put('/election/name', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Election name is required'
      });
    }

    const result = await votingService.setElectionName(name);
    
    logger.info('Election name set', { name, admin: req.user.walletAddress });
    
    res.json({
      success: true,
      message: 'Election name set successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error setting election name', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set election name',
      error: error.message
    });
  }
});

export default router;