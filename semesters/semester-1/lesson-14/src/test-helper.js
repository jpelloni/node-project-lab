function expectThrows(fn) {
    const response =
    {
        threw: false,
        error: null
    }

    try {
        fn();
    } catch (error) {
        response.threw = true;
        response.error = error;
    }

    return response;
}

console.info(expectThrows(() => {
    throw new Error("Boom");
})); // true

console.info(expectThrows(() => {
    console.info("No error thrown");
})); // false