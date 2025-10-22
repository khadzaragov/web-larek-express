import dotenv from 'dotenv';

dotenv.config();

const {
  PORT: PORT_ENV = '3000',
  DB_ADDRESS = 'mongodb://127.0.0.1:27017/weblarek',
  NODE_ENV = 'development',
} = process.env;

const PORT = Number(PORT_ENV) || 3000;

export {
  PORT,
  DB_ADDRESS,
  NODE_ENV,
};
