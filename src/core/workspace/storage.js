
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

// Promisify filesystem operations
const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);
const moveAsync = promisify(fs.rename);

/**
 * Manages storage operations for a specific directory
 */
class StorageManager {
  /**
   * Create a new storage manager for a directory
   * @param {string} dirPath - The directory path to manage
   * @throws {Error} If the directory cannot be created
   */
  constructor(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') {
      throw new Error('Storage path must be a non-empty string');
    }
    
    this.path = dirPath;
    this.ensureDirectoryExists();
  }

  /**
   * Ensure the storage directory exists
   * @private
   */
  async ensureDirectoryExists() {
    try {
      await mkdirAsync(this.path, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory at ${this.path}: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in storage
   * @param {string} key - The file name to check
   * @returns {Promise<boolean>} - Whether the file exists
   */
  async has(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('File key must be a non-empty string');
    }
    
    const filePath = path.join(this.path, key);
    return existsAsync(filePath);
  }

  /**
   * Retrieve a file's contents
   * @param {string} key - The file name to retrieve
   * @returns {Promise<string>} - The file contents
   * @throws {Error} If the file doesn't exist or can't be read
   */
  async get(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('File key must be a non-empty string');
    }
    
    const filePath = path.join(this.path, key);
    
    try {
      const exists = await this.has(key);
      if (!exists) {
        throw new Error(`File '${key}' not found in ${this.path}`);
      }
      
      const content = await readFileAsync(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${key}: ${error.message}`);
    }
  }

  /**
   * Retrieve a file with a default value if it doesn't exist
   * @param {string} key - The file name to retrieve
   * @param {string} defaultValue - Default value if file doesn't exist
   * @returns {Promise<string>} - The file contents or default value
   */
  async getOrDefault(key, defaultValue) {
    try {
      return await this.get(key);
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Save content to a file
   * @param {string} key - The file name
   * @param {string} content - The content to save
   * @throws {Error} If the file can't be written
   */
  async set(key, content) {
    if (!key || typeof key !== 'string') {
      throw new Error('File key must be a non-empty string');
    }
    
    if (typeof content !== 'string') {
      throw new TypeError('Content must be a string');
    }
    
    const filePath = path.join(this.path, key);
    
    try {
      // Ensure parent directory exists
      const dirPath = path.dirname(filePath);
      await mkdirAsync(dirPath, { recursive: true });
      
      await writeFileAsync(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${key}: ${error.message}`);
    }
  }

  /**
   * Synchronous version of set for compatibility
   * @param {string} key - The file name
   * @param {string} content - The content to save
   */
  setSync(key, content) {
    if (!key || typeof key !== 'string') {
      throw new Error('File key must be a non-empty string');
    }
    
    if (typeof content !== 'string') {
      throw new TypeError('Content must be a string');
    }
    
    const filePath = path.join(this.path, key);
    
    // Ensure parent directory exists
    const dirPath = path.dirname(filePath);
    fs.mkdirSync(dirPath, { recursive: true });
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

/**
 * Workspace manager that coordinates multiple storage areas
 */
class WorkspaceManager {
  /**
   * Create a new workspace manager
   * @param {Object} storageAreas - The storage areas to manage
   */
  constructor({ memory, logs, preprompts, input, workspace, archive }) {
    this.memory = memory;
    this.logs = logs;
    this.preprompts = preprompts;
    this.input = input;
    this.workspace = workspace;
    this.archive = archive;
  }

  /**
   * Archive the current workspace
   * @returns {Promise<string>} - The archive path
   */
  async archiveWorkspace() {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .replace(/\..+/, "");
      
    const archivePath = path.join(this.archive.path, timestamp);

    // Create the destination directory
    await mkdirAsync(archivePath, { recursive: true });

    try {
      // Move memory and workspace to archive
      await Promise.all([
        moveAsync(
          this.memory.path,
          path.join(archivePath, path.basename(this.memory.path))
        ),
        moveAsync(
          this.workspace.path,
          path.join(archivePath, path.basename(this.workspace.path))
        ),
      ]);
      
      return archivePath;
    } catch (error) {
      throw new Error(`Failed to archive workspace: ${error.message}`);
    }
  }
}

module.exports = {
  StorageManager,
  WorkspaceManager
};