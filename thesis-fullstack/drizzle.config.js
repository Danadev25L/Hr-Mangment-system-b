require('dotenv').config();

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: '*oaRlywCoG^XOeuy@dIR',
    database: 'HRS',
    ssl: false
  }
};