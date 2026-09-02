import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention), then fall back to .env.
// dotenv silently skips files that don't exist.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses Supabase's PgBouncer pooler).
    // Falls back to DATABASE_URL if DIRECT_URL is not set.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
