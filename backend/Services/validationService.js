import { ethers } from 'ethers';
import { logger } from '../Utils/logger.js';

class ValidationService {
  
  // Validation des adresses Ethereum
  isValidEthereumAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  // Validation et normalisation d'une adresse
  normalizeAddress(address) {
    if (!this.isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    return ethers.getAddress(address); // Retourne l'adresse avec le bon checksum
  }

  // Validation d'une signature
  async verifySignature(message, signature, expectedAddress) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      logger.error('Signature verification failed', error);
      return false;
    }
  }

  // Validation du format d'un message de connexion
  isValidLoginMessage(message, address, nonce, timestamp) {
    const expectedMessage = `Login to VotingDapp\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
    return message === expectedMessage;
  }

  // Validation du nom de candidat
  isValidCandidateName(name) {
    if (typeof name !== 'string') return false;
    const trimmedName = name.trim();
    return trimmedName.length >= 1 && trimmedName.length <= 100;
  }

  // Validation de la description du candidat
  isValidCandidateDescription(description) {
    if (typeof description !== 'string') return false;
    return description.length <= 500;
  }

  // Validation du nom d'élection
  isValidElectionName(name) {
    if (typeof name !== 'string') return false;
    const trimmedName = name.trim();
    return trimmedName.length >= 1 && trimmedName.length <= 200;
  }

  // Validation d'un ID de candidat
  isValidCandidateId(candidateId) {
    const id = parseInt(candidateId);
    return Number.isInteger(id) && id > 0;
  }

  // Validation d'un tableau d'adresses
  validateAddressArray(addresses, minLength = 1, maxLength = 100) {
    if (!Array.isArray(addresses)) {
      throw new Error('Addresses must be an array');
    }
    
    if (addresses.length < minLength || addresses.length > maxLength) {
      throw new Error(`Array must contain between ${minLength} and ${maxLength} addresses`);
    }

    const validatedAddresses = [];
    const seenAddresses = new Set();

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      
      if (!this.isValidEthereumAddress(address)) {
        throw new Error(`Invalid address at index ${i}: ${address}`);
      }
      
      const normalizedAddress = this.normalizeAddress(address);
      
      if (seenAddresses.has(normalizedAddress)) {
        throw new Error(`Duplicate address found: ${normalizedAddress}`);
      }
      
      seenAddresses.add(normalizedAddress);
      validatedAddresses.push(normalizedAddress);
    }

    return validatedAddresses;
  }

  // Validation d'un token JWT payload
  isValidJWTPayload(payload) {
    return payload &&
           typeof payload.walletAddress === 'string' &&
           this.isValidEthereumAddress(payload.walletAddress) &&
           typeof payload.timestamp === 'number' &&
           payload.timestamp > 0;
  }

  // Validation générale d'un objet de données
  validateAndSanitize(data, rules) {
    const result = {};
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      try {
        if (rule.required && (value === undefined || value === null)) {
          errors.push(`${field} is required`);
          continue;
        }
        
        if (value !== undefined && value !== null) {
          if (rule.type === 'string') {
            if (typeof value !== 'string') {
              errors.push(`${field} must be a string`);
              continue;
            }
            
            let processedValue = rule.trim ? value.trim() : value;
            
            if (rule.minLength && processedValue.length < rule.minLength) {
              errors.push(`${field} must be at least ${rule.minLength} characters long`);
              continue;
            }
            
            if (rule.maxLength && processedValue.length > rule.maxLength) {
              errors.push(`${field} must be at most ${rule.maxLength} characters long`);
              continue;
            }
            
            if (rule.pattern && !rule.pattern.test(processedValue)) {
              errors.push(`${field} has invalid format`);
              continue;
            }
            
            result[field] = processedValue;
          }
          
          if (rule.type === 'address') {
            if (!this.isValidEthereumAddress(value)) {
              errors.push(`${field} must be a valid Ethereum address`);
              continue;
            }
            result[field] = this.normalizeAddress(value);
          }
          
          if (rule.type === 'number') {
            const num = parseInt(value);
            if (isNaN(num)) {
              errors.push(`${field} must be a valid number`);
              continue;
            }
            
            if (rule.min !== undefined && num < rule.min) {
              errors.push(`${field} must be at least ${rule.min}`);
              continue;
            }
            
            if (rule.max !== undefined && num > rule.max) {
              errors.push(`${field} must be at most ${rule.max}`);
              continue;
            }
            
            result[field] = num;
          }
        }
      } catch (error) {
        errors.push(`${field}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error('Validation failed: ' + errors.join(', '));
    }

    return result;
  }

  // Règles de validation prédéfinies
  get validationRules() {
    return {
      candidateName: {
        type: 'string',
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 100
      },
      candidateDescription: {
        type: 'string',
        required: false,
        trim: true,
        maxLength: 500
      },
      electionName: {
        type: 'string',
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 200
      },
      walletAddress: {
        type: 'address',
        required: true
      },
      candidateId: {
        type: 'number',
        required: true,
        min: 1
      }
    };
  }
}

// Instance singleton
const validationService = new ValidationService();

export { validationService };
export default validationService;