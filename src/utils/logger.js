
/**
 * Simple logging utility
 */
class Logger {
 /**
  * Create a new logger
  * @param {string} namespace - The logger namespace
  */
 constructor(namespace) {
   this.namespace = namespace;
 }

 /**
  * Format a log message
  * @param {string} level - Log level
  * @param {string} message - Log message
  * @param {Object} [meta] - Additional metadata
  * @returns {string} - Formatted log message
  * @private
  */
 _format(level, message, meta) {
   const timestamp = new Date().toISOString();
   let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}] ${message}`;
   
   if (meta) {
     try {
       const metaStr = typeof meta === 'string' ? meta : JSON.stringify(meta);
       formattedMessage += ` ${metaStr}`;
     } catch (error) {
       formattedMessage += ` [Error serializing metadata: ${error.message}]`;
     }
   }
   
   return formattedMessage;
 }

 /**
  * Log debug message
  * @param {string} message - Log message
  * @param {Object} [meta] - Additional metadata
  */
 debug(message, meta) {
   if (process.env.LOG_LEVEL === 'debug') {
     console.debug(this._format('debug', message, meta));
   }
 }

 /**
  * Log info message
  * @param {string} message - Log message
  * @param {Object} [meta] - Additional metadata
  */
 info(message, meta) {
   console.info(this._format('info', message, meta));
 }

 /**
  * Log warning message
  * @param {string} message - Log message
  * @param {Object} [meta] - Additional metadata
  */
 warn(message, meta) {
   console.warn(this._format('warn', message, meta));
 }

 /**
  * Log error message
  * @param {string} message - Log message
  * @param {Error|Object} [error] - Error object or metadata
  */
 error(message, error) {
   if (error instanceof Error) {
     console.error(this._format('error', message, { 
       message: error.message,
       stack: error.stack
     }));
   } else {
     console.error(this._format('error', message, error));
   }
 }
}

/**
* Create a new logger instance
* @param {string} namespace - The logger namespace
* @returns {Logger} - Logger instance
*/
const createLogger = (namespace) => {
 return new Logger(namespace || 'default');
};

module.exports = {
 createLogger
};