console.info("Starting the loop...");
const start = process.hrtime.bigint();

for (let i = 0; i < 1_000_000; i++) {}

const end = process.hrtime.bigint();
console.info("Loop finished!");
console.info(`Loop took ${end - start} nanoseconds.`);