import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Client } = pkg;
import { daysHoliday } from './db/schema.js';

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();
const db = drizzle(client);

const holidays = await db.select().from(daysHoliday).orderBy(daysHoliday.date);

console.log('\n=== Holidays in Database ===\n');
holidays.forEach(h => {
  console.log(`Name: ${h.name}`);
  console.log(`Date: ${new Date(h.date).toDateString()}`);
  console.log(`isRecurring: ${h.isRecurring}`);
  console.log('---');
});

await client.end();
