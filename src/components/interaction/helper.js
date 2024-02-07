
const { SystemMessage, HumanMessage, AIMessage } = require("langchain/schema");



function serialize_message(messages) {
  const serializedMessages = messages.map((message) => {
    if (message instanceof HumanMessage) {
      return { role: "user", content: message.content };
    } else if (message instanceof SystemMessage) {
      return { role: "assistant", content: message.content };
    } else if (message instanceof AIMessage) {
      return { role: "ai", content: message.content };
    } else {
      throw new Error("Unsupported message type");
    }
  });

  return JSON.stringify(serializedMessages);
}





function deserialize_message(message)
{
 data = JSON.parse(message)

 const messages = data.map((serializedMessage) => {
  if (serializedMessage.role === "user") {
    return new HumanMessage(serializedMessage.content);
  } else if (serializedMessage.role === "assistant") {
    return new SystemMessage(serializedMessage.content);
  }
  else return new AIMessage(serializedMessage.content);
});

 return messages
}


module.exports = {
 serialize_message,
 deserialize_message
}