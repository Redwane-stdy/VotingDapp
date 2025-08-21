import { config } from './config.js';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Niveaux de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = levels[config?.LOG_LEVEL] || levels.info;

function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    error: colors.red,
    warn: colors.yellow,
    info: colors.blue,
    debug: colors.cyan
  };
  
  const color = colorMap[level] || colors.reset;
  let formattedMessage = `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`;
  
  if (data && typeof data === 'object') {
    formattedMessage += '\n' + JSON.stringify(data, null, 2);
  } else if (data) {
    formattedMessage += ` - ${data}`;
  }
  
  return formattedMessage;
}

const logger = {
  error: (message, data = null) => {
    if (currentLevel >= levels.error) {
      console.error(formatMessage('error', message, data));
    }
  },
  
  warn: (message, data = null) => {
    if (currentLevel >= levels.warn) {
      console.warn(formatMessage('warn', message, data));
    }
  },
  
  info: (message, data = null) => {
    if (currentLevel >= levels.info) {
      console.info(formatMessage('info', message, data));
    }
  },
  
  debug: (message, data = null) => {
    if (currentLevel >= levels.debug) {
      console.log(formatMessage('debug', message, data));
    }
  }
};

export { logger };
export default logger;