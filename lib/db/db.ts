import { Pool } from 'pg';

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    if (typeof window === 'undefined') {
      // This code will only run on the server, not during the build or in the browser
      pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
          rejectUnauthorized: false, // No certificate verification
        },
      });
    } else {
      throw new Error("Attempted to access the database pool on the client side.");
    }
  }

  return pool;
}

export { getPool };