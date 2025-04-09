
const { deserializeMessage } = require("../../utils/serialization");
const { extractFilesFromChat } = require("./parser");
const { createLogger } = require("../../utils/logger");

/**
 * Base class for workflow steps
 */
class WorkflowStep {
  /**
   * Create a new workflow step
   * @param {string} name - The step name
   * @param {Function} action - The step action function
   */
  constructor(name, action) {
    this.name = name;
    this.action = action;
    this.logger = createLogger(`Step:${name}`);
  }

  /**
   * Execute the workflow step
   * @param {Interaction} ai - The AI interaction instance
   * @param {WorkspaceManager} workspace - The workspace manager
   * @returns {Promise<any>} - The step result
   */
  async execute(ai, workspace) {
    this.logger.info(`Executing workflow step: ${this.name}`);
    try {
      const result = await this.action(ai, workspace, this.logger);
      this.logger.info(`Completed workflow step: ${this.name}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed in workflow step: ${this.name}`, error);
      throw new Error(`Step ${this.name} failed: ${error.message}`);
    }
  }
}

/**
 * Get the user's prompt from input
 * @param {WorkspaceManager} workspace - The workspace manager
 * @returns {Promise<string>} - The user prompt
 */
const getPrompt = async (workspace) => {
  try {
    if (!(await workspace.input.has("prompt"))) {
      throw new Error(
        "Please put your prompt in the file 'prompt' in the project directory"
      );
    }
    return workspace.input.get("prompt");
  } catch (error) {
    throw new Error(`Failed to get prompt: ${error.message}`);
  }
};

/**
 * Clarify the user's task by asking questions
 * @param {Interaction} ai - The AI interaction
 * @param {WorkspaceManager} workspace - The workspace manager
 * @param {Object} logger - The logger instance
 * @returns {Promise<Array>} - The conversation history
 */
const clarifyTask = async (ai, workspace, logger) => {
  logger.info("Starting task clarification");
  
  try {
    const systemPrompt = await workspace.preprompts.get("clarify");
    let messages = [ai.createSystemMessage(systemPrompt)];
    
    // Get the user's initial prompt
    const userInput = await getPrompt(workspace);
    
    // First step - ask clarifying questions
    messages = await ai.continueConversation(
      messages,
      userInput,
      "clarify task step 1 - ask the right questions"
    );

    // Second step - make assumptions
    messages = await ai.continueConversation(
      messages,
      "Make your own assumptions and state them explicitly before starting",
      "clarify task step 2 - make reasonable assumptions"
    );

    return messages;
  } catch (error) {
    logger.error("Task clarification failed", error);
    throw error;
  }
};

/**
 * Setup prompts for code generation
 * @param {WorkspaceManager} workspace - The workspace manager
 * @returns {Promise<string>} - The combined prompts
 */
const setupPrompts = async (workspace) => {
  try {
    const codeInstructions = await workspace.preprompts.get("codeInstructions");
    const codeStructure = await workspace.preprompts.get("codeStructure");
    
    return `${codeInstructions}\n you should also keep this in mind\n${codeStructure}`;
  } catch (error) {
    throw new Error(`Failed to setup prompts: ${error.message}`);
  }
};

/**
 * Generate program specification
 * @param {Interaction} ai - The AI interaction
 * @param {WorkspaceManager} workspace - The workspace manager
 * @param {Object} logger - The logger instance
 * @returns {Promise<Array>} - The conversation history
 */
const generateSpecification = async (ai, workspace, logger) => {
  logger.info("Generating program specification");
  
  try {
    // Get previous clarification conversation
    const clarifyMessages = deserializeMessage(await workspace.logs.get("clarifyTask"));
    
    // Setup the prompts
    const basePrompts = await setupPrompts(workspace);
    const specificationPrompt = await workspace.preprompts.get("specification");
    
    // Initialize messages with system and previous context
    let messages = [
      ai.createSystemMessage(basePrompts),
      ai.createSystemMessage(specificationPrompt),
      ...clarifyMessages.slice(1) // Skip the first system message from clarify
    ];
    
    // Generate the specification
    messages = await ai.continueConversation(
      messages,
      specificationPrompt,
      "generate program specifications"
    );
    
    // Save the specification
    const specification = messages[messages.length - 1].content.trim();
    await workspace.memory.set("specification", specification);
    
    logger.info("Specification generated successfully");
    return messages;
  } catch (error) {
    logger.error("Specification generation failed", error);
    throw error;
  }
};

/**
 * Generate code based on the specification
 * @param {Interaction} ai - The AI interaction
 * @param {WorkspaceManager} workspace - The workspace manager
 * @param {Object} logger - The logger instance
 * @returns {Promise<Array>} - The conversation history
 */
const generateCode = async (ai, workspace, logger) => {
  logger.info("Generating code");
  
  try {
    // Get previous conversations
    const clarifyMessages = deserializeMessage(await workspace.logs.get("clarifyTask"));
    const specMessages = deserializeMessage(await workspace.logs.get("generateSpecification"));
    
    // Setup the prompts
    const basePrompts = await setupPrompts(workspace);
    const qaPrompt = await workspace.preprompts.get("qa");
    
    // Initialize messages with system and previous context
    let messages = [
      ai.createSystemMessage(basePrompts),
      ...clarifyMessages.slice(1), // Skip the first system message
      ...specMessages.slice(-1) // Get just the final specification response
    ];
    
    // Generate the code
    messages = await ai.continueConversation(
      messages,
      qaPrompt,
      "generate code"
    );
    
    // Extract and save code files
    const codeContent = messages[messages.length - 1].content.trim();
    await extractFilesFromChat(codeContent, workspace.workspace);
    
    logger.info("Code generated successfully");
    return messages;
  } catch (error) {
    logger.error("Code generation failed", error);
    throw error;
  }
};

/**
 * Generate startup commands for the project
 * @param {Interaction} ai - The AI interaction
 * @param {WorkspaceManager} workspace - The workspace manager
 * @param {Object} logger - The logger instance
 * @returns {Promise<Array>} - The conversation history
 */
const generateStartupActions = async (ai, workspace, logger) => {
  logger.info("Generating startup actions");
  
  try {
    const systemPrompt = `
      You will get information about a codebase that is currently on disk in the current folder.
      From this you will answer with code blocks that includes all the necessary to:
      a) install dependencies
      b) run all necessary parts of the codebase (in parallel if necessary)
      Do not explain the code, just give the commands.
      Do not use placeholders, use example values (like . for a folder argument) if necessary.
    `;
    
    // Get the generated code content
    const codebase = await workspace.workspace.get("all_output.txt");
    
    // Generate startup commands
    let messages = await ai.initialize({
      systemMessage: systemPrompt,
      userMessage: "code base: " + codebase,
      actionName: "generate startup actions"
    });
    
    // Extract code blocks from the response
    const lastMessageContent = messages[messages.length - 1].content.trim();
    const codeBlockRegex = /```[^]*?\n([\s\S]+?)```/g;
    const matches = [...lastMessageContent.matchAll(codeBlockRegex)];
    
    if (matches && matches.length > 0) {
      const content = matches.map(match => match[1]).join("\n");
      await workspace.workspace.set("run.sh", content);
      logger.info("Startup script generated successfully");
    } else {
      logger.warn("No code blocks found in the response");
      await workspace.workspace.set("run.sh", "# No startup commands generated");
    }
    
    return messages;
  } catch (error) {
    logger.error("Startup action generation failed", error);
    throw error;
  }
};

// Create workflow steps
const workflowSteps = [
  new WorkflowStep("clarifyTask", clarifyTask),
  new WorkflowStep("generateSpecification", generateSpecification),
  new WorkflowStep("generateCode", generateCode),
  new WorkflowStep("generateStartupActions", generateStartupActions),
  new WorkflowStep("executeProgram", async (ai, workspace, logger) => {
    logger.info("Ready to execute the program");
    logger.info("run.sh is available in the workspace folder");
  }),
  new WorkflowStep("humanReview", async (ai, workspace, logger) => {
    logger.info("Project is ready for human review");
  })
];

module.exports = {
  WorkflowStep,
  workflowSteps,
  clarifyTask,
  generateSpecification,
  generateCode,
  generateStartupActions
};