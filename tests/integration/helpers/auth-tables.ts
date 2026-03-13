/**
 * Creates all tables required by @cfast/auth (Better Auth core + cfast extensions).
 * Each statement is executed individually because D1's exec() does not reliably
 * handle multi-statement strings.
 */
export async function applyAuthMigrations(db: D1Database): Promise<void> {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, image TEXT, email_verified INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, account_id TEXT NOT NULL, provider_id TEXT NOT NULL, access_token TEXT, refresh_token TEXT, access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, id_token TEXT, password TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS verifications (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS passkeys (id TEXT PRIMARY KEY, name TEXT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, public_key TEXT NOT NULL, credential_id TEXT NOT NULL UNIQUE, counter INTEGER NOT NULL DEFAULT 0, device_type TEXT, backed_up INTEGER DEFAULT 0, transports TEXT, created_at INTEGER)",
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, granted_by TEXT REFERENCES users(id), created_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  );
  await db.exec(
    "CREATE TABLE IF NOT EXISTS impersonation_logs (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES users(id), target_user_id TEXT NOT NULL REFERENCES users(id), started_at INTEGER NOT NULL DEFAULT (unixepoch()), ended_at INTEGER)",
  );
}

/**
 * Deletes all rows from auth tables in dependency-safe order.
 */
export async function resetAuthTables(db: D1Database): Promise<void> {
  await db.exec("DELETE FROM impersonation_logs");
  await db.exec("DELETE FROM roles");
  await db.exec("DELETE FROM passkeys");
  await db.exec("DELETE FROM verifications");
  await db.exec("DELETE FROM accounts");
  await db.exec("DELETE FROM sessions");
  await db.exec("DELETE FROM users");
}

/**
 * Insert a user row directly into the users table.
 */
export async function seedAuthUser(
  db: D1Database,
  user: { id: string; email: string; name: string },
): Promise<void> {
  await db
    .prepare("INSERT INTO users (id, email, name) VALUES (?, ?, ?)")
    .bind(user.id, user.email, user.name)
    .run();
}
