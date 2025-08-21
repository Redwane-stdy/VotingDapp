import express from 'express';
import { config } from '../Utils/config.js';
import { logger } from '../Utils/logger.js';
import { votingService } from '../Services/votingService.js';
import { authMiddleware } from '../Middleware/auth.js';

const router = express.Router();

// Obtenir tous les candidats
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await votingService.getAllCandidates();
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    logger.error('Error fetching candidates', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates',
      error: error.message
    });
  }
});

// Obtenir les informations du vote
router.get('/info', async (req, res) => {
  try {
    const info = await votingService.getVotingInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    logger.error('Error fetching voting info', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting info',
      error: error.message
    });
  }
});

// Voter pour un candidat (nécessite authentification)
router.post('/vote', authMiddleware, async (req, res) => {
  try {
    const { candidateId } = req.body;
    const voterAddress = req.user.walletAddress;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID is required'
      });
    }

    const result = await votingService.vote(voterAddress, candidateId);
    
    logger.info('Vote cast', { voterAddress, candidateId });
    
    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error casting vote', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cast vote',
      error: error.message
    });
  }
});

// Obtenir les résultats (si le vote est terminé)
router.get('/results', async (req, res) => {
  try {
    const results = await votingService.getResults();
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error fetching results', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
});

// Obtenir le statut d'un votant
router.get('/voter-status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const status = await votingService.getVoterStatus(address);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error fetching voter status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voter status',
      error: error.message
    });
  }
});

export default router;