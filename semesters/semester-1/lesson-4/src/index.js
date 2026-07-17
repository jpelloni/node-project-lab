const delay = require("./delay");

async function main_await() {
    console.log("Starting");
    console.log("Starting delay 1");
    await delay(5000, 1);
    console.log("Finished delay 1");
    console.log("Starting delay 2");
    await delay(5000, 2);
    console.log("Finished delay 2");
    console.log("Finished all delays");

    // await changed the code to behave synchronously, so the second delay will not start until the first delay has finished.
}

async function main_all() {
    console.log("Starting");
    await Promise.all([
        (async () => {
            console.log("Starting delay 1");
            await delay(5000, 1);
            console.log("Finished delay 1");
        })(),
        (async () => {
            console.log("Starting delay 2");
            await delay(5000, 2);
            console.log("Finished delay 2");
        })()
    ]);
    console.log("Finished all delays");
}

// main_await();
main_all();