const benchmark = require("./benchmark");

let arr = [];
benchmark("Loop", () => {
    for (let i = 0; i < 1_000_000; i++) {
        arr.push(i);

        if (i > 10_000) {
            throw new Error("Too many iterations");
        }
     }
});

console.info(`${arr.length} items in array`);