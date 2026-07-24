require('dotenv').config();

const port = Number(process.env.PORT) || 3000;

console.log(typeof port);