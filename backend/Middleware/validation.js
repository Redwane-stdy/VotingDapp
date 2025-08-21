import { body, param, validationResult } from 'express-validator';
import { logger } from '../Utils/logger.js';

// Middleware pour gérer les erreurs de validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors', { errors: errors.array() });
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  next();
};

// Validations pour l'authentification
export const validateLogin = [
  body('walletAddress')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Valid wallet address required'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  handleValidationErrors
];

// Validations pour les candidats
export const validateAddCandidate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Candidate name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Validations pour l'enregistrement de votants
export const validateRegisterVoter = [
  body('voterAddress')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Valid voter address required'),
  handleValidationErrors
];

export const validateRegisterMultipleVoters = [
  body('voterAddresses')
    .isArray({ min: 1, max: 100 })
    .withMessage('Array of 1-100 voter addresses required'),
  body('voterAddresses.*')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Each voter address must be valid'),
  handleValidationErrors
];

// Validations pour le vote
export const validateVote = [
  body('candidateId')
    .isInt({ min: 1 })
    .withMessage('Valid candidate ID required'),
  handleValidationErrors
];

// Validations pour les paramètres d'URL
export const validateWalletAddress = [
  param('address')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Valid wallet address required'),
  handleValidationErrors
];

// Validation pour le nom de l'élection
export const validateElectionName = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Election name must be between 1 and 200 characters'),
  handleValidationErrors
];

export default {
  handleValidationErrors,
  validateLogin,
  validateAddCandidate,
  validateRegisterVoter,
  validateRegisterMultipleVoters,
  validateVote,
  validateWalletAddress,
  validateElectionName
};