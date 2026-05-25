// server/src/db/index.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Необхідно для хмарних з'єднань
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);