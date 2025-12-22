import postgres from "postgres";
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DB_URL!;
console.log(DATABASE_URL)

export const sql = postgres(DATABASE_URL, {
  max: 20,                    // Connection pool size
  idle_timeout: 20,           // Close idle connections after 20s
  connect_timeout: 10,        // Connection timeout
  prepare: true,              // Use prepared statements (performance boost)
  onnotice: () => { },         // Suppress notices in production
});

// Separate connection for migrations (no prepared statements)
export const migrationSql = postgres(DATABASE_URL, {
  max: 1,
  prepare: false,
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sql.end();
  await migrationSql.end();
  process.exit(0);
});

export default sql;
