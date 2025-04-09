#!/usr/bin/env node
/* eslint-disable no-process-exit */


const fs = require('fs');
const path = require('path');

// Configuration and utilities
const { loadConfig, initializePaths } = require('./src/config');
const { createLogger } = require('./src/utils/logger');
const { serializeMessage } = require('./src/utils/serialization');

// Core components
const { StorageManager, WorkspaceManager } = require('./src/core/workspace/storage');
const Interaction = require('./src/core/interaction');
const { workflowSteps } = require('./src/core/workflow/pipeline');

// Initialize logger
const logger = createLogger('PocketEngineer');

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    logger.error('Invalid number of arguments');
    console.error('Usage: pocket-engineer <path-to-prompt>');
    process.exit(1);
  }
  
  return { promptPath: args[0] };
};

/**
 * Validate the prompt path exists
 * @param {string} promptPath - Path to the prompt file or directory
 * @returns {string} - Validated base path
 */
const validatePromptPath = (promptPath) => {
  const basePath = path.resolve(process.cwd(), promptPath);
  
  if (!fs.existsSync(basePath)) {
    logger.error(`Path does not exist: ${basePath}`);
    console.error(`Error: Path does not exist: ${basePath}`);
    process.exit(1);
  }
  
  return basePath;
};

/**
 * Initialize storage managers for each workspace area
 * @param {Object} paths - Workspace paths
 * @returns {Object} - Storage managers
 */
const initializeStorage = (paths) => {
  logger.debug('Initializing storage managers');
  
  return {
    preprompts: new StorageManager(paths.preprompts),
    input: new StorageManager(paths.input),
    memory: new StorageManager(paths.memory),
    logs: new StorageManager(paths.logs),
    workspace: new StorageManager(paths.workspace),
    archive: new StorageManager(paths.archive)
  };
};

/**
 * Run the code generation workflow
 * @param {WorkspaceManager} workspace - Workspace manager
 * @param {Interaction} ai - AI interaction
 */
const runCodeGeneration = async (workspace, ai) => {
  logger.info('Starting code generation workflow');
  
  for (const step of workflowSteps) {
    logger.info(`Executing workflow step: ${step.name}`);
    
    try {
      const result = await step.execute(ai, workspace);
      
      // Skip logging for steps that don't return results
      if (!result) {
        logger.debug(`Step ${step.name} completed with no result to log`);
        continue;
      }
      
      // Log the step result
      const serialized = serializeMessage(result);
      await workspace.logs.set(step.name, serialized);
      
      logger.info(`Step ${step.name} completed successfully`);
    } catch (error) {
      logger.error(`Failed in step ${step.name}:`, error);
      console.error(`\nError in ${step.name}: ${error.message}`);
      
      // Continue with next steps despite errors
      continue;
    }
  }
  
  logger.info('Code generation workflow completed');
};

/**
 * Main application entry point
 */
async function main() {
  try {
    logger.info('Starting Pocket Engineer');
    
    // Parse arguments and validate prompt path
    const { promptPath } = parseArgs();
    const basePath = validatePromptPath(promptPath);
    
    // Load configuration
    const config = loadConfig();
    
    // Initialize paths and storage
    const paths = initializePaths(basePath);
    const storageManagers = initializeStorage(paths);
    const workspace = new WorkspaceManager(storageManagers);
    
    // Initialize AI interaction
    const ai = new Interaction({
      model: config.ai.model,
      temperature: config.ai.temperature,
      streaming: config.ai.streaming
    });
    
    // Run the code generation workflow
    await runCodeGeneration(workspace, ai);
    
    logger.info('Pocket Engineer completed successfully');
  } catch (error) {
    logger.error('Fatal error:', error);
    console.error(`\nFatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the application
main().catch(error => {
  console.error(`Uncaught error: ${error.message}`);
  process.exit(1);
});