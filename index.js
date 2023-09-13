require("dotenv").config();

const path = require("path");
const fs = require("fs");

const { workItem, archive } = require("./src/components/workspace");

const Interaction = require("./src/components/interaction");

const workflow = require("./src/components/workflow");
const { serialize_message } = require("./src/components/interaction/helper");

const args = process.argv;

if (args.length != 3) throw new Error("please provide a path for your task");

const basePath = path.join(args[2]);

if (!fs.existsSync(basePath)) {
  throw new Error(`Path does not exisis: ${basePath}`);
}

const db = {};

db.preprompts = new workItem(path.join("./src/preprompts"));

db.input = new workItem(basePath);
db.memory = new workItem(path.join(basePath, "memory"));
db.logs = new workItem(path.join(basePath, "logs"));
db.workspace = new workItem(path.join(basePath, "workspace"));
db.archive = new workItem(path.join(basePath, "archive"));

const ai = new Interaction();

archive(db);

(async function () {
  for (let stepName in workflow) {
    console.log(stepName);
    step = workflow[stepName];

    result = await step(ai, db);

    if (!result) continue;

    serialized = serialize_message(result);

    db.logs.set(stepName, serialized);
  }
})();
