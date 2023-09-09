
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const moveAsync = promisify(fs.rename);

const workPlace = require("./workplace");
const workItem = require("./workplaceItem");


async function archive(dbs) {
 const timestamp = new Date()
   .toISOString()
   .replace(/[-:]/g, "")
   .replace("T", "_")
   .replace(/\..+/, "");
 const archivePath = path.join(dbs.archive.path, timestamp);

 console.log(timestamp);
 console.log(archivePath);

 // Create the destination directory if it doesn't exist
 if (!fs.existsSync(archivePath)) {
   fs.mkdirSync(archivePath, { recursive: true });
 }

 await Promise.all([
   moveAsync(
     dbs.memory.path,
     path.join(archivePath, path.basename(dbs.memory.path))
   ),
   moveAsync(
     dbs.workspace.path,
     path.join(archivePath, path.basename(dbs.workspace.path))
   ),
 ]);

}

module.exports = {
 archive,
 workPlace,
 workItem
}

