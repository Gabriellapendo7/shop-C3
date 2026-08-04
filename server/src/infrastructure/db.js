import { Pool } from "pg";

// The pool is the default executor for every repository function. Repositories
// call executor.query(...) rather than a helper here, because pool.query and
// client.query share a signature — so one repository function works both
// standalone and enlisted in a caller's open transaction.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
});

// Direct query helper for routes that don't use repositories
export const query = (sql, params) => pool.query(sql, params);