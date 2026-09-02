// Applies prisma/sql/constraints.sql — the CHECK constraints, partial indexes,
// and triggers Prisma's schema cannot express. Run after `prisma migrate deploy`.
// The file is idempotent, so re-running is safe.
//
//   node scripts/apply-constraints.mjs

import { readFile } from "node:fs/promises";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DIRECT_URL (or DATABASE_URL) in the environment.");
  process.exit(1);
}

const sql = await readFile(new URL("../prisma/sql/constraints.sql", import.meta.url), "utf8");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  // Sent as one simple-protocol query so the whole file applies atomically.
  await client.query(`BEGIN;\n${sql}\nCOMMIT;`);
  console.log("constraints.sql applied.");
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(`Failed to apply constraints.sql: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
