import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Parse DATABASE_URL to check if it's a Render database
const isRenderDatabase = process.env.DATABASE_URL?.includes('render.com');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Only use SSL for Render databases, not for your existing database
    ssl: isRenderDatabase ? { rejectUnauthorized: false } : false
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
