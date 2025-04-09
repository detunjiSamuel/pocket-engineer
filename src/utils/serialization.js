
const { SystemMessage, HumanMessage, AIMessage } = require("langchain/schema");
const { createLogger } = require("./logger");

const logger = createLogger('Serialization');

/**
 * Serialize message history to JSON string
 * @param {Array} messages - Array of LangChain message objects
 * @returns {string} - JSON string representation
 * @throws {Error} If serialization fails
 */
const serializeMessage = (messages) => {
  if (!messages || !Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }
  
  try {
    const serializedMessages = messages.map((message) => {
      if (message instanceof HumanMessage) {
        return { role: "user", content: message.content };
      } else if (message instanceof SystemMessage) {
        return { role: "system", content: message.content };
      } else if (message instanceof AIMessage) {
        return { role: "assistant", content: message.content };
      } else {
        logger.warn(`Unknown message type: ${typeof message}`);
        return { role: "unknown", content: String(message.content || '') };
      }
    });
    
    return JSON.stringify(serializedMessages);
  } catch (error) {
    logger.error('Failed to serialize messages:', error);
    throw new Error(`Message serialization failed: ${error.message}`);
  }
};

/**
 * Deserialize messages from JSON string to LangChain message objects
 * @param {string} serializedMessages - JSON string of messages
 * @returns {Array} - Array of LangChain message objects
 * @throws {Error} If deserialization fails
 */
const deserializeMessage = (serializedMessages) => {
  if (!serializedMessages || typeof serializedMessages !== 'string') {
    throw new Error('Serialized messages must be a string');
  }
  
  try {
    const data = JSON.parse(serializedMessages);
    
    if (!Array.isArray(data)) {
      throw new Error('Deserialized data must be an array');
    }
    
    const messages = data.map((serializedMessage) => {
      if (!serializedMessage || typeof serializedMessage !== 'object') {
        logger.warn('Invalid message format in deserialized data');
        return new SystemMessage('Invalid message');
      }
      
      if (serializedMessage.role === "user") {
        return new HumanMessage(serializedMessage.content || '');
      } else if (serializedMessage.role === "system") {
        return new SystemMessage(serializedMessage.content || '');
      } else if (serializedMessage.role === "assistant" || serializedMessage.role === "ai") {
        return new AIMessage(serializedMessage.content || '');
      } else {
        logger.warn(`Unknown role type: ${serializedMessage.role}`);
        return new SystemMessage(serializedMessage.content || '');
      }
    });
    
    return messages;
  } catch (error) {
    logger.error('Failed to deserialize messages:', error);
    throw new Error(`Message deserialization failed: ${error.message}`);
  }
};

module.exports = {
  serializeMessage,
  deserializeMessage
};