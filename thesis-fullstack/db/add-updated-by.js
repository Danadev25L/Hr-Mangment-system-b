import pkg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pkg;

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function addUpdatedByColumn() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Step 1: Add updated_by column (nullable first)
        console.log('Adding updated_by column...');
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS updated_by INTEGER;
        `);
        console.log('Column added successfully');

        // Step 2: Add foreign key constraint
        console.log('Adding foreign key constraint...');
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'users_updated_by_fkey'
                ) THEN
                    ALTER TABLE users 
                    ADD CONSTRAINT users_updated_by_fkey 
                    FOREIGN KEY (updated_by) REFERENCES users(id);
                END IF;
            END $$;
        `);
        console.log('Foreign key constraint added');

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

addUpdatedByColumn().catch(console.error);
