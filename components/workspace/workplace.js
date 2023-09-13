class Workplace {
 /**
  * @param {number} i
  * @param {string} j
  * @returns {number}
  */
 constructor(memory, logs, preprompts, input, workspace, archive) {
   this.memory = memory;
   this.logs = logs;
   this.preprompts = preprompts;
   this.input = input;
   this.workspace = workspace;
   this.archive = archive;
 }
}

module.exports =  Workplace 