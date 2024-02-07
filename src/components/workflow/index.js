function get_prompt(dbs) {
  if (!dbs.input.has("prompt") && !dbs.input.has("main_prompt"))
    throw new Error(
      "Please put your prompt in the file 'prompt' in the project directory"
    );

  if (!dbs.input.has("prompt")) {
    console.log(
      "",
      "Please put the prompt in the file 'prompt', not 'main_prompt'"
    );

    return dbs.input.get("main_prompt");
  }
  return dbs.input.get("prompt");
}

async function clarifyTask(ai, db) {
  /**
   * Talk clerification
   */

  messages = [ai.fsystem(db.preprompts.get("clarify"))];

  user_input = get_prompt(db);

  messages = await ai.nextStep(messages, user_input, "clarifyTask");

  console.log(messages[messages.length - 1].content)

  

  console.log("=== == = = == = == = = = ");

  console.log(" GENERATING CLERIFICATIONS ");

  messages = await ai.nextStep(
    messages,
    "Make your own assumptions and state them explicitly before starting",
    "clarifyTask"
  );

  console.log("=== == = = == = == = = = ");

  console.log(messages[messages.length - 1].content)

  return messages;
}

function setupPrompts(db) {
 /**
  * structure to return out put and also good practice to follow
  */
 return db.preprompts.get("codeInstructions") + "\n you should also keep this in mind" + db.preprompts.get("codeStructure");
}


async function generateSpecification( ai  , db)
{
   /**
    *  create specification from prompt + clearifications
    */

   messages = [

    ai.fsystem(setupPrompts(db)),

    ai.fsystem(db.preprompts.get("specification"))
   
   ];

   messages = await ai.nextStep(messages, db.preprompts.get("specification"), "generateSpecification");

   db.memory.set("specification", messages[messages.length - 1].content.trim() );

   console.log("=== == = = == = == = = = ");
  
   console.log(messages[messages.length - 1].content)
  

   return messages
}

const { deserialize_message} =  require('../interaction/serialization')
const {toFiles} = require('./files_chat')

async function generateCode( ai  , db) {


 messages = deserialize_message(

  db.logs.get("clarifyTask")

 )

 messages = [

  ai.fsystem( setupPrompts(db) ),

  ...messages.slice(1)

 ]

 messages = await ai.nextStep(messages, db.preprompts.get("qa"), "generateCode");

 console.log("=== == = = == = == = = = ");

 // console.log("calliing toFiles")

 toFiles(messages[messages.length - 1].content.trim() , db.workspace)

 return messages

}




async function generateStartupActions(ai , db) {

 goals = [
  "You will get information about a codebase that is currently on disk in the current folder",
  "From this you will answer with code blocks that includes all the necessary to : ",
  "a) install dependencies",
  "b) run all necessary parts of the codebase (in parallel if necessary)",
  "Do not explain the code, just give the commands.",
  "Do not use placeholders, use example values (like . for a folder argument) ",
  "if necessary"
 ]

 msg = ""

 for (let goal in goals){
  msg += goal
 }

 messages = await ai.init(
  {
   system_message : msg,
   user_message : "code base :" +  db.workspace.get("all_output.txt"),
   action_name : "generateStartupActions"
  }
 )

 const regex = /```[^]*?\n([\s\S]+?)```/g;
 const lastMessageContent = messages[messages.length - 1].content.trim();
 const matches = [...lastMessageContent.matchAll(regex)];

 const content = matches.map(match => match[1]).join("\n");

 db.workspace.set("run.sh" ,  content)


 
 return messages


}

function executeProgram(ai , db )
{
 console.log(" you can now run excute the program created")

 console.log(" run.sh is created in the workspace folder")


}

function humanReview (ai , db)
{
 console.log( "review the code if you want")
}


module.exports = {
 "clarifyTask" : clarifyTask,
 "generateSpecification" : generateSpecification,
 "generateCode" : generateCode,
 "generateStartupActions" : generateStartupActions,
 "executeProgram" : executeProgram,
 "humanReview" : humanReview,
}