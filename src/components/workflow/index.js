const { deserializeMessage } = require("../interaction/serialization");
const { toFiles } = require("./parser");

const getPrompt = (db) => {
  if (!db.input.has("prompt")) {
    throw new Error(
      "Please put your prompt in the file 'prompt' in the project directory"
    );
  }
  return db.input.get("prompt");
};

const clarifyTask = async (ai, db) => {
  let messages = [ai.fsystem(db.preprompts.get("clarify"))];
  const user_input = await getPrompt(db);

  messages = await ai.nextStep(
    messages,
    user_input,
    "clarify task step 1 - ask the right questions"
  );

  messages = await ai.nextStep(
    messages,
    "Make your own assumptions and state them explicitly before starting",
    "clarify task step 2 - make reasonable assumptions"
  );

  return messages;
};

const setupPrompts = (db) => {
  return (
    db.preprompts.get("codeInstructions") +
    "\n you should also keep this in mind" +
    db.preprompts.get("codeStructure")
  );
};

const generateSpecification = async (ai, db) => {
  let messages = [
    ai.fsystem(setupPrompts(db)),
    ai.fsystem(db.preprompts.get("specification")),
    ...deserializeMessage(db.logs.get("clarifyTask")).slice(1),
  ];

  messages = await ai.nextStep(
    messages,
    db.preprompts.get("specification"),
    "generate program specifications"
  );

  db.memory.set("specification", messages[messages.length - 1].content.trim());
  return messages;
};

const generateCode = async (ai, db) => {
  let messages = deserializeMessage(db.logs.get("clarifyTask"));

  messages = [
    ai.fsystem(setupPrompts(db)),
    ...messages.slice(1),
    ...deserializeMessage(db.logs.get("generateSpecification")).slice(-1),
  ];

  messages = await ai.nextStep(
    messages,
    db.preprompts.get("qa"),
    "generate code"
  );

  toFiles(messages[messages.length - 1].content.trim(), db.workspace);

  return messages;
};

const generateStartupActions = async (ai, db) => {
  const goals = [
    "You will get information about a codebase that is currently on disk in the current folder",
    "From this you will answer with code blocks that includes all the necessary to : ",
    "a) install dependencies",
    "b) run all necessary parts of the codebase (in parallel if necessary)",
    "Do not explain the code, just give the commands.",
    "Do not use placeholders, use example values (like . for a folder argument) ",
    "if necessary",
  ];

  let msg = "";

  for (const goal of goals) {
    msg += goal;
  }

  let messages = await ai.init({
    system_message: msg,
    user_message: "code base :" + db.workspace.get("all_output.txt"),
    action_name: "generate Startup actions",
  });

  const regex = /```[^]*?\n([\s\S]+?)```/g;
  const lastMessageContent = messages[messages.length - 1].content.trim();
  const matches = [...lastMessageContent.matchAll(regex)];

  const content = matches.map((match) => match[1]).join("\n");

  db.workspace.set("run.sh", content);

  return messages;
};

const executeProgram = () => {
  console.log("You can now run execute the program created");
  console.log("run.sh is created in the workspace folder");
};

const humanReview = () => {
  console.log("Review the code if you want");
};

const code_generation_steps = [
  { action_name: "clarifyTask", action: clarifyTask },
  { action_name: "generateSpecification", action: generateSpecification },
  { action_name: "generateCode", action: generateCode },
  { action_name: "generateStartupActions", action: generateStartupActions },
  { action_name: "executeProgram", action: executeProgram },
  { action_name: "humanReview", action: humanReview },
];

module.exports = {
  clarifyTask,
  generateSpecification,
  generateCode,
  generateStartupActions,
  executeProgram,
  humanReview,
  code_generation_steps,
};
