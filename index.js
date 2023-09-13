require("dotenv").config();

const path = require("path");

const { workItem, workPlace, archive } = require("./components/workspace");

const Interaction = require("./components/interaction");

const workflow = require("./components/workflow");
const { serialize_message } = require("./components/interaction/helper");

basePath = "./data";

const args = process.argv;

if (args.length != 3) throw new Error("please provide a path for your task");

input = new workItem(path.join(args[2]));

const ai = new Interaction();

memory = new workItem(path.join(basePath, "memory"));
logs = new workItem(path.join(basePath, "logs"));

preprompts = new workItem(path.join("./preprompts"));

workspace = new workItem(path.join(basePath, "workspace"));

archive_ = new workItem(path.join(basePath, "archive"));

const db = new workPlace(memory, logs, preprompts, input, workspace, archive_);

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

// clarify(test, dbs).then((messages) => {
//   console.log("done");

//   console.log(messages);
// });
