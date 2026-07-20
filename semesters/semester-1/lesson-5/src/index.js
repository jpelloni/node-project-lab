const ValidationError = require("./errors/validation.error");

function validate(input) {
    if (input === undefined) {
        throw new ValidationError("Input is undefined");
    }

    return input;
}

function main(input) {
    try {
        const value = validate(input);
        console.log("Value:", value);
        console.log("Finished");
    }
    catch (err) {
        if (err instanceof ValidationError) {
            console.log("Caught validation error");
        } else {
            console.log("Caught");
        }
    }
}

// Test the function with different inputs
main(undefined); // Caught validation error
main(null);      // Finished
main('valid');   // Finished