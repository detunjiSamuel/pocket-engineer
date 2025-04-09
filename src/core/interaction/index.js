const { SystemMessage, HumanMessage, AIMessage } = require("langchain/schema");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { createLogger } = require("../../utils/logger");

/**
 * Manages interactions with the AI language model
 */
class Interaction {
  /**
   * Create a new AI interaction instance
   * @param {Object} options - Configuration options
   * @param {string} options.model - The model name to use
   * @param {number} options.temperature - The temperature setting
   * @param {boolean} options.streaming - Whether to use streaming mode
   * @param {Object} options.logger - Logger instance
   */
  constructor({
    model = "gpt-3.5-turbo",
    temperature = 0.1,
    streaming = true,
    logger = createLogger("AI-Interaction")
  } = {}) {
    this.temperature = temperature;
    this.model = model;
    this.streaming = streaming;
    this.logger = logger;

    this.llm = new ChatOpenAI({
      modelName: model,
      streaming: streaming,
      temperature: temperature,
    });
    
    this.logger.info(`Initialized AI interaction with model: ${model}, temperature: ${temperature}`);
  }

  /**
   * Initialize a new conversation
   * @param {Object} params - Initialization parameters
   * @param {string} params.systemMessage - The system message to start with
   * @param {string} params.userMessage - The initial user message
   * @param {string} params.actionName - Name of the action being performed
   * @returns {Promise<Array>} - The message history
   */
  async initialize({ systemMessage, userMessage, actionName }) {
    const messages = [new SystemMessage(systemMessage)];
    return this.continueConversation(messages, userMessage, actionName);
  }

  /**
   * Create a system message
   * @param {string} message - The system message content
   * @returns {SystemMessage} - The formatted system message
   */
  createSystemMessage(message) {
    return new SystemMessage(message);
  }

  /**
   * Create a user message
   * @param {string} message - The user message content
   * @returns {HumanMessage} - The formatted user message
   */
  createUserMessage(message) {
    return new HumanMessage(message);
  }
  
  /**
   * Create an assistant message
   * @param {string} message - The assistant message content
   * @returns {AIMessage} - The formatted assistant message
   */
  createAssistantMessage(message) {
    return new AIMessage(message);
  }

  /**
   * Continue an existing conversation with a new user message
   * @param {Array} messages - The existing message history
   * @param {string} userInput - The new user input
   * @param {string} actionName - Name of the action being performed
   * @returns {Promise<Array>} - The updated message history
   */
  async continueConversation(messages, userInput, actionName) {
    if (!messages || !Array.isArray(messages)) {
      this.logger.error("Invalid messages provided to continueConversation");
      throw new Error("Messages must be an array of message objects");
    }
    
    if (userInput) {
      this.logger.debug(`Adding user message for action: ${actionName}`);
      messages.push(new HumanMessage(userInput));
    }

    try {
      this.logger.info(`Executing ${actionName} action`);
      const response = await this.llm.call(messages);
      messages.push(response);
      
      const lastMessage = messages[messages.length - 1].content;
      this.logger.debug(`Received response for ${actionName}`, {
        contentLength: lastMessage.length,
        preview: lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : '')
      });
      
      return messages;
    } catch (error) {
      this.logger.error(`Error in AI interaction for ${actionName}`, error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }
}

module.exports = Interaction;