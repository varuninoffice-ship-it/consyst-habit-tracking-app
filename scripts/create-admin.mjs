// Creates the first admin: a Supabase auth user plus the matching `users` row
// with role = 'admin'. Safe to re-run — both steps are idempotent on email.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' node scripts/create-admin.mjs
//
// Requires DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME = "Admin",
  ADMIN_TIMEZONE = "UTC",
} = process.env;

const missing = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: created, error } = await supabase.auth.admin.createUser({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: ADMIN_NAME },
});

if (error && !/already been registered|already exists/i.test(error.message)) {
  console.error(`Supabase auth user creation failed: ${error.message}`);
  process.exit(1);
}

console.log(
  created?.user
    ? `Supabase auth user created: ${created.user.id}`
    : "Supabase auth user already existed — leaving it as is."
);

// Strip pooler params the pg driver does not understand, matching lib/prisma.ts.
const url = new URL(DATABASE_URL);
url.searchParams.delete("sslmode");
url.searchParams.delete("pgbouncer");

const client = new pg.Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  const { rows } = await client.query(
    `INSERT INTO users (name, email, system_started_at, timezone, role, updated_at)
     VALUES ($1, $2, CURRENT_DATE, $3, 'admin', now())
     ON CONFLICT (email) DO UPDATE
       SET role = 'admin', updated_at = now()
     RETURNING id, email, role`,
    [ADMIN_NAME, ADMIN_EMAIL, ADMIN_TIMEZONE]
  );
  console.log(`Admin row ready: ${rows[0].email} (${rows[0].id}) role=${rows[0].role}`);
} finally {
  await client.end();
}
