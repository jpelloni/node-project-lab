console.info("Starting the loop...");
const start = process.hrtime.bigint();
console.info(`Memory usage before the loop: ${process.memoryUsage().heapUsed} bytes.`);

const arr = [];
for (let i = 0; i < 1_000_000; i++) {
  arr.push(i);
}

console.info(`Memory usage after the loop: ${process.memoryUsage().heapUsed} bytes.`);
const end = process.hrtime.bigint();
console.info("Loop finished!");
console.info(`Loop took ${end - start} nanoseconds.`);