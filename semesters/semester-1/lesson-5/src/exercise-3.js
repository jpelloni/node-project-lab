async function run() {
    try {
        await Promise.reject(
            new Error("Boom")
        );
    }
    catch {
        console.log("Caught");
    }
}

run();

// Why does this one work?
// The `catch` block executes because of the `await` keyword inside an async function