require('dotenv').config();

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL 
    ? {
        url: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '*oaRlywCoG^XOeuy@dIR',
        database: process.env.DB_NAME || 'HRS',
        ssl: false
      }
};