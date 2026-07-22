const fs = require("fs");

const stream = fs.createReadStream("large-test-data.txt", "utf8");

stream.on("data", (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});

stream.on("end", () => {
  console.log("Finished reading the file.");
});

stream.on("error", (err) => {
  console.error("Error reading the file:", err);
});
