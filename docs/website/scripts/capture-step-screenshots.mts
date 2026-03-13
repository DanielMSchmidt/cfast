/**
 * Captures screenshots from each tutorial step project for docs.
 *
 * Run with: pnpm docs:screenshots
 *
 * For each step that needs screenshots:
 * 1. Generates drizzle migrations (if step has a DB)
 * 2. Applies migrations to local D1
 * 3. Starts the dev server
 * 4. Creates test users via Better Auth API (if step has auth)
 * 5. Seeds data via wrangler d1 execute (if step needs data)
 * 6. Takes screenshots with Playwright
 * 7. Stops the dev server and cleans up
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import { execSync, spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TUTORIALS_DIR = path.resolve(__dirname, "../../tutorials/team-blog");
const SCREENSHOTS_DIR = path.resolve(__dirname, "../src/assets/tutorial");
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_PASSWORD = "TestPassword123!";
const VIEWPORT = { width: 1280, height: 720 };

// --- Types ---

type Role = "admin" | "editor" | "author" | "reader";

interface ScreenshotDef {
  name: string;
  path: string;
  waitFor?: string;
  role?: Role;
}

type PostsSchema = "simple" | "full";

interface StepConfig {
  dir: string;
  needsDb: boolean;
  needsAuth: boolean;
  needsRoles: boolean;
  needsPosts: false | PostsSchema;
  screenshots: ScreenshotDef[];
}

// --- Step definitions ---

const steps: StepConfig[] = [
  {
    dir: "step-01-setup",
    needsDb: false,
    needsAuth: false,
    needsRoles: false,
    needsPosts: false,
    screenshots: [
      { name: "step-01-home", path: "/", waitFor: "Team Blog" },
    ],
  },
  {
    dir: "step-03-auth",
    needsDb: true,
    needsAuth: false,
    needsRoles: false,
    needsPosts: false,
    screenshots: [
      { name: "step-03-login", path: "/login" },
    ],
  },
  {
    dir: "step-04-permissions",
    needsDb: true,
    needsAuth: true,
    needsRoles: true,
    needsPosts: "simple",
    screenshots: [
      { name: "step-04-author-home", path: "/", waitFor: "Team Blog", role: "author" },
      { name: "step-04-reader-home", path: "/", waitFor: "Team Blog", role: "reader" },
    ],
  },
  {
    dir: "step-05-crud",
    needsDb: true,
    needsAuth: true,
    needsRoles: true,
    needsPosts: "full",
    screenshots: [
      { name: "step-05-post-detail", path: "/posts/post-001", role: "editor" },
      { name: "step-05-new-post", path: "/posts/new", role: "author" },
    ],
  },
  {
    dir: "step-06-admin",
    needsDb: true,
    needsAuth: true,
    needsRoles: true,
    needsPosts: "full",
    screenshots: [
      { name: "step-06-admin", path: "/admin", role: "admin" },
    ],
  },
  // step-08-email: no unique screenshots (no /profile route in this step)
];

// --- Helpers ---

function log(step: string, msg: string) {
  console.log(`[${step}] ${msg}`);
}

function exec(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf-8" });
}

function execQuiet(cmd: string, cwd: string) {
  execSync(cmd, { cwd, stdio: "pipe" });
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status > 0) return;
    } catch {
      // server not ready
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function startDevServer(cwd: string): ChildProcess {
  const child = spawn("pnpm", ["dev", "--port", String(PORT)], {
    cwd,
    stdio: "pipe",
    env: { ...process.env, PORT: String(PORT) },
  });
  child.stderr?.on("data", () => {}); // drain stderr
  child.stdout?.on("data", () => {}); // drain stdout
  return child;
}

function stopServer(child: ChildProcess) {
  child.kill("SIGTERM");
  // Give it a moment, then force
  setTimeout(() => {
    if (!child.killed) child.kill("SIGKILL");
  }, 3000);
}

function cleanupLocalDb(cwd: string) {
  const wranglerState = path.join(cwd, ".wrangler");
  if (fs.existsSync(wranglerState)) {
    fs.rmSync(wranglerState, { recursive: true, force: true });
  }
}

// --- DB setup ---

function setupDatabase(stepDir: string, step: string, needsAuth: boolean) {
  log(step, "Generating migrations...");
  execQuiet("npx drizzle-kit generate", stepDir);

  log(step, "Applying migrations...");
  execQuiet("npx wrangler d1 migrations apply DB --local", stepDir);

  if (needsAuth) {
    // Ensure impersonation_logs table exists (used by @cfast/auth internally)
    const sql = `CREATE TABLE IF NOT EXISTS impersonation_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );`;
    execQuiet(`npx wrangler d1 execute DB --local --command "${sql}"`, stepDir);
  }
}

// --- Auth + seeding ---

async function createTestUsers(
  baseUrl: string,
): Promise<Record<Role, string>> {
  const users: { key: Role; email: string; name: string }[] = [
    { key: "admin", email: "admin@example.com", name: "Admin User" },
    { key: "editor", email: "editor@example.com", name: "Editor User" },
    { key: "author", email: "author@example.com", name: "Author User" },
    { key: "reader", email: "reader@example.com", name: "Reader User" },
  ];

  const cookies: Record<string, string> = {};

  for (const user of users) {
    const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        password: TEST_PASSWORD,
      }),
    });

    const allCookies = res.headers.getSetCookie();
    for (const c of allCookies) {
      const match = c.match(/better-auth\.session_token=([^;]+)/);
      if (match) { cookies[user.key] = match[1]; break; }
    }

    if (!cookies[user.key]) {
      // Try sign-in if user already exists
      const signInRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: baseUrl },
        body: JSON.stringify({ email: user.email, password: TEST_PASSWORD }),
      });
      const signInCookies = signInRes.headers.getSetCookie();
      for (const c of signInCookies) {
        const match = c.match(/better-auth\.session_token=([^;]+)/);
        if (match) { cookies[user.key] = match[1]; break; }
      }
    }

    if (!cookies[user.key]) {
      console.warn(`  Warning: failed to get session cookie for ${user.key}`);
    }
  }

  return cookies as Record<Role, string>;
}

function getUserIds(stepDir: string): Record<Role, string> {
  const roles: Role[] = ["admin", "editor", "author", "reader"];
  const emails: Record<Role, string> = {
    admin: "admin@example.com",
    editor: "editor@example.com",
    author: "author@example.com",
    reader: "reader@example.com",
  };
  const ids: Record<string, string> = {};

  for (const role of roles) {
    const result = exec(
      `npx wrangler d1 execute DB --local --command "SELECT id FROM users WHERE email = '${emails[role]}'"`,
      stepDir,
    );
    const parsed = JSON.parse(result.substring(result.indexOf("[")));
    const actualId = parsed[0]?.results?.[0]?.id;
    if (actualId) ids[role] = actualId;
  }

  return ids as Record<Role, string>;
}

function seedRoles(stepDir: string, userIds: Record<Role, string>) {
  const now = Math.floor(Date.now() / 1000);
  const statements = [
    `INSERT OR IGNORE INTO roles (id, user_id, role, created_at) VALUES ('role-admin', '${userIds.admin}', 'admin', ${now});`,
    `INSERT OR IGNORE INTO roles (id, user_id, role, created_at) VALUES ('role-editor', '${userIds.editor}', 'editor', ${now});`,
    `INSERT OR IGNORE INTO roles (id, user_id, role, created_at) VALUES ('role-author', '${userIds.author}', 'author', ${now});`,
  ];
  const sql = statements.join("\n");
  const tmpFile = path.join(stepDir, ".tmp-seed.sql");
  fs.writeFileSync(tmpFile, sql);
  try {
    execQuiet(`npx wrangler d1 execute DB --local --file "${tmpFile}"`, stepDir);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

function seedPosts(stepDir: string, userIds: Record<Role, string>, schema: PostsSchema) {
  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 86400;
  const weekAgo = now - 604800;

  const esc = (s: string) =>
    s.replace(/'/g, "''").replace(/\n/g, "' || char(10) || '");

  let statements: string[];

  if (schema === "simple") {
    // step-04: integer autoincrement id, no slug/excerpt/published_at/updated_at
    statements = [
      `INSERT OR IGNORE INTO posts (title, content, author_id, published, created_at) VALUES ('${esc("Getting Started with Cloudflare Workers")}', '${esc("Cloudflare Workers provide a serverless execution environment.")}', '${userIds.author}', 1, ${weekAgo});`,
      `INSERT OR IGNORE INTO posts (title, content, author_id, published, created_at) VALUES ('${esc("Advanced Drizzle ORM Patterns")}', '${esc("Draft content about Drizzle ORM patterns.")}', '${userIds.author}', 0, ${dayAgo});`,
      `INSERT OR IGNORE INTO posts (title, content, author_id, published, created_at) VALUES ('${esc("Best Practices for React Router v7")}', '${esc("React Router v7 introduces many new features.")}', '${userIds.editor}', 1, ${weekAgo});`,
    ];
  } else {
    // step-05+: text id, slug, excerpt, published_at, updated_at
    statements = [
      `INSERT OR IGNORE INTO posts (id, title, slug, content, excerpt, author_id, published, published_at, created_at, updated_at) VALUES ('post-001', '${esc("Getting Started with Cloudflare Workers")}', 'getting-started-with-cloudflare-workers', '${esc("Cloudflare Workers provide a serverless execution environment.")}', '${esc("Learn the basics of building serverless applications.")}', '${userIds.author}', 1, ${dayAgo}, ${weekAgo}, ${dayAgo});`,
      `INSERT OR IGNORE INTO posts (id, title, slug, content, excerpt, author_id, published, published_at, created_at, updated_at) VALUES ('post-002', '${esc("Advanced Drizzle ORM Patterns")}', 'advanced-drizzle-orm-patterns', '${esc("Draft content about Drizzle ORM patterns.")}', '${esc("Exploring advanced patterns with Drizzle ORM.")}', '${userIds.author}', 0, NULL, ${dayAgo}, ${dayAgo});`,
      `INSERT OR IGNORE INTO posts (id, title, slug, content, excerpt, author_id, published, published_at, created_at, updated_at) VALUES ('post-003', '${esc("Best Practices for React Router v7")}', 'best-practices-for-react-router-v7', '${esc("React Router v7 introduces many new features.")}', '${esc("Discover the best practices for React Router v7.")}', '${userIds.editor}', 1, ${dayAgo}, ${weekAgo}, ${dayAgo});`,
    ];
  }

  const sql = statements.join("\n");
  const tmpFile = path.join(stepDir, ".tmp-seed.sql");
  fs.writeFileSync(tmpFile, sql);
  try {
    execQuiet(`npx wrangler d1 execute DB --local --file "${tmpFile}"`, stepDir);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// --- Screenshot capture ---

async function loginAs(context: BrowserContext, cookie: string) {
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: cookie,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

async function captureScreenshot(
  page: Page,
  screenshot: ScreenshotDef,
) {
  await page.goto(`${BASE_URL}${screenshot.path}`, {
    waitUntil: "networkidle",
  });

  if (screenshot.waitFor) {
    await page.getByText(screenshot.waitFor).first().waitFor({ state: "visible" });
  }

  // Small delay for animations to settle
  await page.waitForTimeout(500);

  const outputPath = path.join(SCREENSHOTS_DIR, `${screenshot.name}.png`);
  await page.screenshot({
    path: outputPath,
    fullPage: false,
    animations: "disabled",
  });
}

// --- Main ---

async function main() {
  console.log("Tutorial Step Screenshot Capture");
  console.log("================================\n");

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();

  for (const step of steps) {
    const stepDir = path.join(TUTORIALS_DIR, step.dir);
    const stepName = step.dir;

    if (!fs.existsSync(stepDir)) {
      console.warn(`Skipping ${stepName}: directory not found`);
      continue;
    }

    log(stepName, "Starting...");

    // Clean up any previous local DB state
    cleanupLocalDb(stepDir);

    // Set up database if needed
    if (step.needsDb) {
      setupDatabase(stepDir, stepName, step.needsAuth);
    }

    // Start dev server
    log(stepName, "Starting dev server...");
    const server = startDevServer(stepDir);

    try {
      await waitForServer(BASE_URL);
      log(stepName, "Dev server ready");

      // Create test users if needed
      let sessionCookies: Record<Role, string> | undefined;
      if (step.needsAuth) {
        log(stepName, "Creating test users...");
        sessionCookies = await createTestUsers(BASE_URL);

        const userIds = getUserIds(stepDir);

        if (step.needsRoles) {
          log(stepName, "Seeding roles...");
          seedRoles(stepDir, userIds);
        }

        if (step.needsPosts) {
          log(stepName, "Seeding posts...");
          seedPosts(stepDir, userIds, step.needsPosts);
        }
      }

      // Take screenshots
      for (const screenshot of step.screenshots) {
        log(stepName, `Capturing ${screenshot.name}...`);

        const context = await browser.newContext({ viewport: VIEWPORT });

        if (screenshot.role && sessionCookies) {
          await loginAs(context, sessionCookies[screenshot.role]);
        }

        const page = await context.newPage();
        try {
          await captureScreenshot(page, screenshot);
          log(stepName, `  -> ${screenshot.name}.png`);
        } catch (err) {
          console.error(`  Error capturing ${screenshot.name}:`, err);
        } finally {
          await context.close();
        }
      }
    } finally {
      log(stepName, "Stopping dev server...");
      stopServer(server);
      // Wait a moment for ports to free up
      await new Promise((r) => setTimeout(r, 2000));
    }

    log(stepName, "Done\n");
  }

  await browser.close();
  console.log("All screenshots captured!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
