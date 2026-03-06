import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { adminUser, editorUser, authorUser, readerUser, generateSeedSQL, generateDataSQL } from "./seed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..");
const STATE_FILE = path.join(PROJECT_DIR, ".e2e-state.json");

const TEST_PASSWORD = "TestPassword123!";

type TestState = {
  sessionCookies: Record<string, string>;
  userIds: Record<string, string>;
};

function executeSQL(sql: string) {
  const tmpFile = path.join(PROJECT_DIR, ".tmp-seed.sql");
  fs.writeFileSync(tmpFile, sql);
  try {
    execSync(
      `npx wrangler d1 execute DB --local --file "${tmpFile}"`,
      { cwd: PROJECT_DIR, stdio: "pipe" }
    );
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

function saveState(state: TestState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function loadState(): TestState {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error("E2E state file not found. Did globalSetup run?");
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

function buildIdMap(userIds: Record<string, string>): Record<string, string> {
  const idMap: Record<string, string> = {};
  if (userIds.admin) idMap[adminUser.id] = userIds.admin;
  if (userIds.editor) idMap[editorUser.id] = userIds.editor;
  if (userIds.author) idMap[authorUser.id] = userIds.author;
  if (userIds.reader) idMap[readerUser.id] = userIds.reader;
  return idMap;
}

function replaceUserIds(sql: string, idMap: Record<string, string>): string {
  for (const [seedId, actualId] of Object.entries(idMap)) {
    sql = sql.replaceAll(seedId, actualId);
  }
  return sql;
}

export function resetDatabase() {
  // Apply migrations
  execSync("npx wrangler d1 migrations apply DB --local", {
    cwd: PROJECT_DIR,
    stdio: "pipe",
  });

  // Clear existing data
  const clearSQL = [
    "DELETE FROM audit_logs;",
    "DELETE FROM impersonation_logs;",
    "DELETE FROM comments;",
    "DELETE FROM posts;",
    "DELETE FROM roles;",
    "DELETE FROM passkeys;",
    "DELETE FROM verifications;",
    "DELETE FROM accounts;",
    "DELETE FROM sessions;",
    "DELETE FROM users;",
  ].join("\n");

  executeSQL(clearSQL);
}

export function seedData() {
  const { userIds } = loadState();
  const idMap = buildIdMap(userIds);
  const sql = replaceUserIds(generateDataSQL().join("\n"), idMap);
  executeSQL(sql);
}

export function seedAll() {
  executeSQL(generateSeedSQL());
}

export function resetAndSeedDatabase() {
  const clearDataSQL = [
    "DELETE FROM audit_logs;",
    "DELETE FROM impersonation_logs;",
    "DELETE FROM comments;",
    "DELETE FROM posts;",
    "DELETE FROM roles;",
  ].join("\n");

  executeSQL(clearDataSQL);

  const { userIds } = loadState();
  const idMap = buildIdMap(userIds);
  const sql = replaceUserIds(generateDataSQL().join("\n"), idMap);
  executeSQL(sql);
}

export async function createTestSessions(baseURL: string) {
  const testUsers = [
    { key: "admin", ...adminUser },
    { key: "editor", ...editorUser },
    { key: "author", ...authorUser },
    { key: "reader", ...readerUser },
  ];

  const sessionCookies: Record<string, string> = {};
  const userIds: Record<string, string> = {};

  for (const user of testUsers) {
    // Sign up via Better Auth API — creates user + account + session
    const res = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": baseURL },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        password: TEST_PASSWORD,
      }),
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
      if (match) {
        sessionCookies[user.key] = match[1];
      }
    }

    if (!sessionCookies[user.key]) {
      // If signup failed (user exists), try sign-in
      const signInRes = await fetch(`${baseURL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": baseURL },
        body: JSON.stringify({
          email: user.email,
          password: TEST_PASSWORD,
        }),
      });
      const signInCookie = signInRes.headers.get("set-cookie");
      if (signInCookie) {
        const match = signInCookie.match(/better-auth\.session_token=([^;]+)/);
        if (match) {
          sessionCookies[user.key] = match[1];
        }
      }
    }

    if (!sessionCookies[user.key]) {
      console.error(`Failed to get session cookie for ${user.key} (${user.email})`);
    }
  }

  // Read back the actual IDs that Better Auth generated
  for (const user of testUsers) {
    const result = execSync(
      `npx wrangler d1 execute DB --local --command "SELECT id FROM users WHERE email = '${user.email}'"`,
      { cwd: PROJECT_DIR, encoding: "utf-8" }
    );
    const parsed = JSON.parse(result.substring(result.indexOf("[")));
    const actualId = parsed[0]?.results?.[0]?.id;
    if (actualId) {
      userIds[user.key] = actualId;
    }
  }

  // Persist state for test files to read
  saveState({ sessionCookies, userIds });
}
