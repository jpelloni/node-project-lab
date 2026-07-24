require('dotenv').config();

if (!process.env.PORT) {
  throw new Error('PORT is not defined in the environment variables');
}

if (!process.env.NAME) {
  throw new Error('NAME is not defined in the environment variables');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  name: process.env.NAME
};