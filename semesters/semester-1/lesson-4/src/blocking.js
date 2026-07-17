console.log("Start");

setTimeout(() => {
    console.log("Timer");
}, 0);

const start = Date.now();

while (Date.now() - start < 5000) {}

console.log("Finished");

// Why doesn't the timer fire immediately?
// the while loop at line 9 blocks the event loop