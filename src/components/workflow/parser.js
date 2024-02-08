function parseChat(chat) {
  const regex = /(\S+)\n\s*```\s*[^\n]*\n([\s\S]+?)```/g;
  const matches = [...chat.matchAll(regex)];

  const files = [];

  for (const match of matches) {
    let path = match[1];

    path = path.replace(/[\:<>"|?*]/g, "");
    path = path.replace(/^\[(.*)\]$/, "$1");
    path = path.replace(/^`(.*)`$/, "$1");
    path = path.replace(/[\]\:]$/, "");

    const code = match[2];
    files.push([path, code]);
  }

  const readme = chat.split("```")[0];
  files.push(["README.md", readme]);

  return files;
}

function toFiles(chat, workspace) {
  workspace.set("all_output.txt", chat);

  files = parseChat(chat);


  console.log(files.length);

  for (file of files) {
    // file name , content

    console.log("=====================================");

    console.log( "file name : " + file[0])

    console.log( "file content : " + file[1])

    workspace.set(file[0], file[1]);
  }
}

module.exports = {
  toFiles,
  parseChat,
};
