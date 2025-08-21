import { REGEX } from './constants';

// Utilitaires pour les adresses Ethereum
export const addressUtils = {
  // Vérifier si une adresse est valide
  isValidAddress: (address) => {
    return typeof address === 'string' && REGEX.ETHEREUM_ADDRESS.test(address);
  },

  // Formater une adresse (tronquer au milieu)
  formatAddress: (address, startChars = 6, endChars = 4) => {
    if (!addressUtils.isValidAddress(address)) return 'Invalid Address';
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  },

  // Comparer deux adresses (insensible à la casse)
  addressesEqual: (address1, address2) => {
    if (!address1 || !address2) return false;
    return address1.toLowerCase() === address2.toLowerCase();
  },

  // Normaliser une adresse (lowercase)
  normalizeAddress: (address) => {
    return address ? address.toLowerCase() : '';
  }
};

// Utilitaires pour les nombres
export const numberUtils = {
  // Formater un grand nombre avec des séparateurs
  formatNumber: (num, locale = 'en-US') => {
    if (isNaN(num)) return '0';
    return Number(num).toLocaleString(locale);
  },

  // Formater les ETH avec décimales limitées
  formatEther: (ethValue, decimals = 4) => {
    const num = parseFloat(ethValue);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  },

  // Calculer un pourcentage
  calculatePercentage: (value, total) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
  },

  // Arrondir à n décimales
  roundTo: (num, decimals) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
};

// Utilitaires pour les chaînes de caractères
export const stringUtils = {
  // Capitaliser la première lettre
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Tronquer un texte
  truncate: (str, maxLength, suffix = '...') => {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength) + suffix;
  },

  // Nettoyer et normaliser du texte
  sanitize: (str) => {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ');
  },

  // Générer un slug à partir d'un texte
  slugify: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

// Utilitaires pour les dates
export const dateUtils = {
  // Formater une date
  formatDate: (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    return new Date(date).toLocaleDateString('en-US', formatOptions);
  },

  // Calculer le temps relatif (il y a X temps)
  timeAgo: (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  },

  // Vérifier si une date est valide
  isValidDate: (date) => {
    return date instanceof Date && !isNaN(date);
  }
};

// Utilitaires pour les erreurs
export const errorUtils = {
  // Extraire un message d'erreur lisible
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.reason) return error.reason;
    if (error?.data?.message) return error.data.message;
    return 'An unexpected error occurred';
  },

  // Vérifier si l'erreur est liée au réseau
  isNetworkError: (error) => {
    const message = errorUtils.getErrorMessage(error).toLowerCase();
    return message.includes('network') || 
           message.includes('connection') || 
           message.includes('timeout') ||
           message.includes('fetch');
  },

  // Vérifier si l'erreur est liée à l'authentification
  isAuthError: (error) => {
    return error?.response?.status === 401 || 
           error?.status === 401 ||
           errorUtils.getErrorMessage(error).toLowerCase().includes('unauthorized');
  }
};

// Utilitaires pour le localStorage
export const storageUtils = {
  // Sauvegarder des données dans le localStorage
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  // Récupérer des données du localStorage
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  // Supprimer une clé du localStorage
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  // Vider le localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Utilitaires pour les validations
export const validationUtils = {
  // Valider une adresse email
  isValidEmail: (email) => {
    return REGEX.EMAIL.test(email);
  },

  // Valider un nombre
  isValidNumber: (value) => {
    return !isNaN(value) && isFinite(value);
  },

  // Valider la longueur d'une chaîne
  isValidLength: (str, min = 0, max = Infinity) => {
    if (!str) return min === 0;
    return str.length >= min && str.length <= max;
  },

  // Valider un formulaire
  validateForm: (data, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = data[field];
      
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[field] = `${field} is required`;
      } else if (value) {
        if (rule.minLength && value.length < rule.minLength) {
          errors[field] = `${field} must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[field] = `${field} must be no more than ${rule.maxLength} characters`;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = rule.message || `${field} format is invalid`;
        }
        if (rule.custom && !rule.custom(value)) {
          errors[field] = rule.message || `${field} is invalid`;
        }
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Utilitaires pour l'interface utilisateur
export const uiUtils = {
  // Debounce une fonction
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle une fonction
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Copier du texte dans le presse-papiers
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  },

  // Générer une couleur aléatoire
  generateRandomColor: () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  },

  // Calculer la couleur de contraste
  getContrastColor: (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155 ? '#000000' : '#ffffff';
  }
};

// Utilitaires pour les promesses
export const promiseUtils = {
  // Attendre un certain temps
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Retry une promesse
  retry: async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await promiseUtils.delay(delay);
      }
    }
  },

  // Timeout pour une promesse
  timeout: (promise, ms) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), ms)
      )
    ]);
  }
};

// Export de tous les utilitaires
export default {
  addressUtils,
  numberUtils,
  stringUtils,
  dateUtils,
  errorUtils,
  storageUtils,
  validationUtils,
  uiUtils,
  promiseUtils
};