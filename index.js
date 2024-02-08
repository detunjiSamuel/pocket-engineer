#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { workItem, archive } = require("./src/components/workspace");
const Interaction = require("./src/components/interaction");
const { code_generation_steps } = require("./src/components/workflow");
const {
  serialize_message,
} = require("./src/components/interaction/serialization");

try {
  const dotenv = require("dotenv");
  dotenv.config();
} catch (err) {
  throw new Error("Error loading env");
}

const args = process.argv;

if (args.length !== 3) {
  throw new Error("Please provide a path for your task");
}

const userProvidedPath = args[2];
const basePath = path.resolve(process.cwd(), userProvidedPath);

if (!fs.existsSync(basePath)) {
  throw new Error(`Path does not exist: ${basePath}`);
}

const db = {
  preprompts: new workItem(path.join(__dirname, "src", "preprompts")),
  input: new workItem(basePath),
  memory: new workItem(path.join(basePath, "memory")),
  logs: new workItem(path.join(basePath, "logs")),
  workspace: new workItem(path.join(basePath, "workspace")),
  archive: new workItem(path.join(basePath, "archive")),
};

const ai = new Interaction();

(async function runCodeGeneration() {
  for (const step of code_generation_steps) {
    console.log(step.action_name);
    const result = await step.action(ai, db);

    if (!result) {
      continue;
    }
 
    const serialized = serialize_message(result);
    db.logs.set(step.action_name, serialized);
  }
})();
