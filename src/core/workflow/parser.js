const path = require('path');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('CodeParser');

/**
 * Extract file information from AI chat response
 * @param {string} chat - The chat content with code blocks
 * @returns {Array<Array<string>>} - Array of [filename, content] pairs
 */
const parseCodeFromChat = (chat) => {
  if (!chat || typeof chat !== 'string') {
    throw new Error('Invalid chat content provided to parser');
  }
  
  logger.debug('Starting to parse chat for code files');
  
  // Match filename followed by code block
  const regex = /(\S+)\n\s*```\s*[^\n]*\n([\s\S]+?)```/g;
  const matches = [...chat.matchAll(regex)];
  
  const files = [];
  
  for (const match of matches) {
    let filePath = match[1];

    // Clean up filename
    filePath = filePath
      .replace(/[\:<>"|?*]/g, "") // Remove invalid file characters
      .replace(/^\[(.*)\]$/, "$1") // Remove brackets
      .replace(/^`(.*)`$/, "$1")   // Remove backticks
      .replace(/[\]\:]$/, "");     // Remove trailing brackets/colons
    
    const code = match[2];
    files.push([filePath, code]);
    
    logger.debug(`Parsed file: ${filePath} (${code.length} bytes)`);
  }
  
  // Add README from the first part of the chat
  const readme = chat.split("```")[0].trim();
  if (readme) {
    files.push(["README.md", readme]);
    logger.debug('Added README.md');
  }
  
  logger.info(`Parsed ${files.length} files from chat`);
  
  return files;
};

/**
 * Validates a file path to ensure it's safe
 * @param {string} filePath - The file path to validate
 * @returns {string} - The sanitized file path
 * @throws {Error} If the file path is invalid or unsafe
 */
const validateFilePath = (filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }
  
  // Basic path traversal protection
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.startsWith('..') || normalizedPath.includes('../')) {
    throw new Error('Path traversal detected in file path');
  }
  
  
  return normalizedPath;
};

/**
 * Write parsed files to the workspace
 * @param {string} chat - The chat content with code blocks
 * @param {Object} workspace - The workspace storage manager
 * @returns {Promise<Array<string>>} - Array of written filenames
 */
const extractFilesFromChat = async (chat, workspace) => {
  try {
    // Store the full AI output for reference
    await workspace.set("all_output.txt", chat);
    
    // Parse files from the chat
    const files = parseCodeFromChat(chat);
    logger.info(`Extracting ${files.length} files to workspace`);
    
    const writtenFiles = [];
    
    // Write each file to the workspace
    for (const [filePath, content] of files) {
      try {
        const validatedPath = validateFilePath(filePath);
        
        logger.debug(`Writing file: ${validatedPath}`);
        await workspace.set(validatedPath, content);
        writtenFiles.push(validatedPath);
      } catch (error) {
        logger.error(`Failed to write file ${filePath}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    logger.info(`Successfully wrote ${writtenFiles.length} files to workspace`);
    return writtenFiles;
  } catch (error) {
    logger.error('Failed to extract files from chat:', error);
    throw new Error(`File extraction failed: ${error.message}`);
  }
};

module.exports = {
  parseCodeFromChat,
  extractFilesFromChat,
  validateFilePath
};