import pg from "pg";
import "dotenv/config";

// Return DATE columns as plain "YYYY-MM-DD" strings (avoids timezone day-shift bugs)
pg.types.setTypeParser(1082, (v) => v);

// Mongo: mongoose.connect(url) once.
// Postgres: a Pool keeps several connections open and hands them out per query.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);
