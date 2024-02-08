const { SystemMessage, HumanMessage, AIMessage } = require("langchain/schema");
const { ChatOpenAI } = require("langchain/chat_models/openai");

class Interaction {
  constructor(model = "gpt-3.5-turbo", temperature = 0.1) {
    console.log("=====================================");

    console.log(" constructor");
    console.log("model: " + model);
    console.log("temperature: " + temperature);

    console.log("=====================================");

    this.temperature = temperature;
    this.model = model;

    this.llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      streaming: true,
      temperature: 0.1,
    });
  }

  init({ system_message, user_message, action_name }) {
    const messages = [new SystemMessage(system_message)];

    return this.nextStep(messages, user_message, action_name);
  }

  fsystem(message) {
    return new SystemMessage(message);
  }

  fuser(message) {
    return new HumanMessage(message);
  }
  fassistant(message) {
    return new AIMessage(message);
  }

  async nextStep(messages, user_input, action_name) {
    if (user_input) messages.push(new HumanMessage(user_input));

    const response = await this.llm.call(messages);

    messages.push(response);

    console.log("=== == = = == = == = = =");

    console.log(action_name.toUpperCase());

    console.log(messages[messages.length - 1].content);

    return messages;
  }
}

module.exports = Interaction;
