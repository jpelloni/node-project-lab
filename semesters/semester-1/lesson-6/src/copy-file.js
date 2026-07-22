const fs = require("fs");

fs.createReadStream('large-test-data.txt', 'utf8')
    .pipe(fs.createWriteStream('copy-of-large-test-data.txt'));