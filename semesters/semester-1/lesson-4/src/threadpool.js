await Promise.all([
    fs.readFile("a.txt"),
    fs.readFile("b.txt"),
    fs.readFile("c.txt")
]);

// How many JavaScript threads are running?
// 1

// How many operating-system operations may be happening?
// 3