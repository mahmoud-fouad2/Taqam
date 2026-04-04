import pg from "pg";
import { hash } from "bcryptjs";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const bootstrapEnabled =
  process.env.ENABLE_SUPER_ADMIN_BOOTSTRAP === "1" ||
  process.env.ENABLE_SUPER_ADMIN_BOOTSTRAP === "true";

if (!bootstrapEnabled) {
  console.error("ENABLE_SUPER_ADMIN_BOOTSTRAP must be enabled to run this script");
  process.exit(1);
}

const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!superAdminEmail || !password) {
  console.error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set");
  process.exit(1);
}

const email = superAdminEmail.toLowerCase();

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  const client = await pool.connect();
  try {
    // Check user count
    const countRes = await client.query('SELECT COUNT(*)::int AS cnt FROM "User"');
    const userCount = countRes.rows[0]?.cnt ?? 0;
    console.log(`[db-admin] User count: ${userCount}`);

    // Check if super admin exists
    const existingRes = await client.query('SELECT id, email, role, status FROM "User" WHERE email = $1', [email]);
    const existing = existingRes.rows[0];

    const passwordHash = await hash(password, 12);

    if (existing) {
      // Update password + ensure active
      await client.query(
        'UPDATE "User" SET password = $1, role = $2, status = $3, "failedLoginAttempts" = 0, "lockedUntil" = NULL WHERE email = $4',
        [passwordHash, "SUPER_ADMIN", "ACTIVE", email]
      );
      console.log(`[db-admin] Updated super admin: ${email}`);
    } else {
      // Insert new (permissions as text array)
      await client.query(
        `INSERT INTO "User" (id, email, password, "firstName", "lastName", role, status, permissions, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'Super', 'Admin', 'SUPER_ADMIN', 'ACTIVE', ARRAY[]::text[], NOW(), NOW())`,
        [email, passwordHash]
      );
      console.log(`[db-admin] Created super admin: ${email}`);
    }

    // Verify
    const verifyRes = await client.query('SELECT id, email, role, status FROM "User" WHERE email = $1', [email]);
    console.log("[db-admin] Verified:", verifyRes.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("[db-admin] Error:", e);
  process.exit(1);
});
