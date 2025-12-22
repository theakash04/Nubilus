import fs from "fs";
import path from "path";
import sql from "..";

async function runMigrations() {
  try {
    console.log("Checking migrations table...");

    // Create migrations table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        run_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const migrationsDir = path.join(process.cwd(), "src/db/migrations");

    if (!fs.existsSync(migrationsDir)) {
      console.error("Migrations folder not found:", migrationsDir);
      process.exit(1);
    }

    // Get migration files
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort(); // ensure order like 001_..., 002_...

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      // Check if already applied
      const applied = await sql`
        SELECT name FROM _migrations WHERE name = ${file}
      `;

      if (applied.length > 0) {
        console.log(`SKIP: ${file}`);
        continue;
      }

      console.log(`RUNNING: ${file}`);

      const fullPath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(fullPath, "utf8");

      if (!sqlContent.trim()) {
        console.warn(`EMPTY FILE: ${file}, skipping.`);
        continue;
      }

      // Execute SQL file
      try {
        await sql.unsafe(sqlContent);
      } catch (err) {
        console.error(`ERROR in migration ${file}`);
        throw err;
      }

      // Record migration as applied
      await sql`
        INSERT INTO _migrations (name) VALUES (${file})
      `;

      console.log(`DONE: ${file}`);
    }

    console.log("All migrations applied successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigrations();
