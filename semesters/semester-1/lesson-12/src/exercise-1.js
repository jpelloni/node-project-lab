function divide(a, b) {
    return a / c;
}

divide(10, 2);

// Use the stack trace to locate the problem.
/*
ReferenceError: c is not defined
    at divide (/workspaces/node-project-lab/semesters/semester-1/lesson-12/src/exercise-1.js:2:16) **Source of error**
    at Object.<anonymous> (/workspaces/node-project-lab/semesters/semester-1/lesson-12/src/exercise-1.js:5:1)
    at Module._compile (node:internal/modules/cjs/loader:1812:14)
    at Object..js (node:internal/modules/cjs/loader:1943:10)
    at Module.load (node:internal/modules/cjs/loader:1533:32)
    at Module._load (node:internal/modules/cjs/loader:1335:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47
*/