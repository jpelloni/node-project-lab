function test() {
    try {
        throw new Error("Boom");
    }
    catch (err) {
        console.log("Caught");
    }

    console.log("Finished");
}

test();

// Predicted Output:
// Finished
// Caught

// Actual Output:
// Caught
// Finished

