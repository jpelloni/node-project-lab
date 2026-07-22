const fs = require("fs");

const before = process.memoryUsage();

fs.readFile("test-data.txt", "utf8", (err, data) => {
  const after = process.memoryUsage();

  console.log({
    beforeHeapUsed: before.heapUsed,
    afterHeapUsed: after.heapUsed,
    delta: after.heapUsed - before.heapUsed
  });
});

const beforeStream = process.memoryUsage();
const stream = fs.createReadStream("test-data.txt", "utf8");
const afterStream = process.memoryUsage();

console.log({
  beforeStreamHeapUsed: beforeStream.heapUsed,
  afterStreamHeapUsed: afterStream.heapUsed,
  streamDelta: afterStream.heapUsed - beforeStream.heapUsed
});
