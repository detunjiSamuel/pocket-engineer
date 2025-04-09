const path = require('path');
const { createLogger } = require('../utils/logger');

const logger = createLogger('Config');

/**
 * Load and validate environment variables
 * @param {Object} [env=process.env] - Environment variables
 * @returns {Object} - Validated configuration
 */
const loadConfig = (env = process.env) => {
  // Load .env file if available
  try {
    require('dotenv').config();
  } catch (error) {
    logger.warn('Failed to load .env file, continuing with environment variables', error);
  }
  
  // Get OpenAI API key
  const openAiApiKey = env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  // Build configuration object
  const config = {
    ai: {
      apiKey: openAiApiKey,
      model: env.AI_MODEL || 'gpt-3.5-turbo',
      temperature: parseFloat(env.AI_TEMPERATURE || '0.1'),
      maxTokens: parseInt(env.AI_MAX_TOKENS || '4096', 10),
      streaming: env.AI_STREAMING !== 'false'
    },
    app: {
      logLevel: env.LOG_LEVEL || 'info',
      basePath: env.BASE_PATH || process.cwd()
    }
  };
  
  logger.debug('Configuration loaded', {
    model: config.ai.model,
    temperature: config.ai.temperature
  });
  
  return config;
};

/**
 * Initialize workspace paths
 * @param {string} basePath - Base path for the workspace
 * @returns {Object} - Workspace paths
 */
const initializePaths = (basePath) => {
  const resolvedBasePath = path.resolve(process.cwd(), basePath);
  logger.debug(`Initializing paths with base: ${resolvedBasePath}`);
  
  return {
    preprompts: path.join(__dirname, '..', 'preprompts'),
    input: resolvedBasePath,
    memory: path.join(resolvedBasePath, 'memory'),
    logs: path.join(resolvedBasePath, 'logs'),
    workspace: path.join(resolvedBasePath, 'workspace'),
    archive: path.join(resolvedBasePath, 'archive')
  };
};

module.exports = {
  loadConfig,
  initializePaths
};