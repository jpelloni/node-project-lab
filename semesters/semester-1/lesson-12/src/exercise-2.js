function a() {
    console.log('a');
    b();
}

function b() {
    console.log('b');
    c();
}

function c() {
    throw new Error('c is not defined');
}

a();

// Which frames belong to you?
// Which belong to Node?
/*
Error: c is not defined
    at c (/workspaces/node-project-lab/semesters/semester-1/lesson-12/src/exercise-2.js:12:11) <- my code
    at b (/workspaces/node-project-lab/semesters/semester-1/lesson-12/src/exercise-2.js:8:5) <- my code
    at a (/workspaces/node-project-lab/semesters/semester-1/lesson-12/src/exercise-2.js:3:5) <- my code
    at Object.<anonymous> (/workspaces/node-project-lab/semesters/semester-1/lesson-12/src/exercise-2.js:15:1) <- my code
    at Module._compile (node:internal/modules/cjs/loader:1812:14) <- Node
    at Object..js (node:internal/modules/cjs/loader:1943:10) <- Node
    at Module.load (node:internal/modules/cjs/loader:1533:32) <- Node
    at Module._load (node:internal/modules/cjs/loader:1335:12) <- Node
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19) <- Node
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5) <- Node
*/