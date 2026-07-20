try {
    Promise.reject(
        new Error("Boom")
    );
}
catch {
    console.log("Caught");
}

// Does the `catch` execute?
// Preditction
// No, the `catch` is thrown asynchronously, so it does not execute in this case. The `catch` block is only executed for synchronous errors.