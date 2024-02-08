const fs = require("fs");
const path = require("path");

// This class represents a simple database that stores its data as files in a directory.
class Item {
  constructor(path) {
    this.path = path;
    fs.mkdirSync(this.path, { recursive: true });
  }

  has(key) {
    return fs.existsSync(path.join(this.path, key));
  }

  get(key) {
    const fullFilePath = path.join(this.path, key);

    if (!fs.existsSync(fullFilePath)) {
      throw new Error(`File '${key}' could not be found in '${this.path}'`);
    }

    return fs.readFileSync(fullFilePath, "utf-8");
  }

  getOrDefault(key, defaultValue) {
    try {
      return this.get(key);
    } catch (error) {
      return defaultValue;
    }
  }

  set(key, val) {
    const fullFilePath = path.join(this.path, key);
    fs.mkdirSync(path.dirname(fullFilePath), { recursive: true });

    if (typeof val == "string") {
      fs.writeFileSync(fullFilePath, val, "utf-8");
    } else {
      throw new TypeError("val must be a string");
    }
  }
}


module.exports = Item;