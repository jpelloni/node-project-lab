const a = require("./counter");
const b = require("./counter");

console.log(a.count);
console.log(b.count);

const one = require("./greeting");
const two = require("./greeting");

console.log(require.cache);

console.log(exports === module.exports);

exports = {};
console.log(exports === module.exports);

module.exports = {};
console.log(exports === module.exports);

const logger = require("./logger");
logger.info("Node Project Lab");