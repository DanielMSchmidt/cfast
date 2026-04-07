import { describe, it, afterAll } from "vitest";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import type { Features } from "../types";
import {
  packagesBuilt,
  scaffoldAndBuild,
  runInDir,
  MONOREPO_ROOT,
} from "./scaffold-test-helpers";

/** Ask the OS for a free TCP port. Only used to avoid clashing with any dev
 *  servers the developer already has running on 5173. */
async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("could not determine free port")));
      }
    });
  });
}

/**
 * Scaffold-smoke tests go one step past scaffold-build: after the scaffold
 * compiles cleanly, they spin up the dev server via Playwright's webServer
 * and run the template's `e2e/smoke.spec.ts` against it. This catches
 * regressions where the template compiles but any of the generated routes
 * (index, login, admin, auth.$) actually 500 at runtime, or where the smoke
 * spec itself breaks for a fresh scaffold.
 *
 * Why this matters: a fresh scaffold is the first thing every new cfast user
 * sees. If `pnpm test:e2e` doesn't pass on day zero, the template is broken.
 *
 * We pick a representative subset (not all 8 combos) because each run adds
 * ~30-60s on top of the build for browser install + dev server + e2e. The
 * Playwright browsers cache is shared across runs via `PLAYWRIGHT_BROWSERS_PATH`
 * pointing at a repo-local directory.
 */

// Share one Playwright browser install across all test runs. Default to the
// normal system cache if it already exists (dev machines); otherwise use a
// repo-local cache so CI can persist between runs without re-downloading.
const SYSTEM_BROWSERS_CACHE =
  process.platform === "darwin"
    ? path.join(
        process.env.HOME ?? "",
        "Library",
        "Caches",
        "ms-playwright",
      )
    : path.join(process.env.HOME ?? "", ".cache", "ms-playwright");

const REPO_BROWSERS_CACHE = path.join(
  MONOREPO_ROOT,
  "node_modules",
  ".cache",
  "ms-playwright",
);

const PLAYWRIGHT_BROWSERS_PATH = fs.existsSync(SYSTEM_BROWSERS_CACHE)
  ? SYSTEM_BROWSERS_CACHE
  : REPO_BROWSERS_CACHE;

function smokeEnv(port: number): NodeJS.ProcessEnv {
  return {
    PLAYWRIGHT_BROWSERS_PATH,
    // Force CI behaviour so Playwright doesn't try to reuse a dev server
    // already listening on the port.
    CI: "1",
    // Template `playwright.config.ts` reads E2E_PORT to decide which port the
    // webServer binds `pnpm dev` to. Defaults to 5173 when unset.
    E2E_PORT: String(port),
  };
}

const tempDirs: string[] = [];

async function scaffoldAndSmoke(
  features: Partial<Features>,
  label: string,
): Promise<void> {
  const { wsRoot, projectDir } = await scaffoldAndBuild(features, label, tempDirs);
  const port = await getFreePort();
  const env = smokeEnv(port);

  // Install chromium into the shared cache (no-op if already present).
  await runInDir("pnpm exec playwright install chromium", projectDir, {
    timeout: 300_000,
    env,
  });

  // Generate and apply local D1 migrations when the combo has a database.
  // Fresh scaffolds ship a drizzle schema but no migrations folder, so we
  // run `db:generate` first to produce one before applying it locally.
  if (features.db || features.admin || features.auth) {
    await runInDir("pnpm db:generate", projectDir, {
      timeout: 120_000,
      env,
    });
    await runInDir("pnpm db:migrate:local", projectDir, {
      timeout: 120_000,
      env,
    });
  }

  // The dev-vars generator already writes MAILGUN_API_KEY=test-key for email
  // combos; nothing extra needed here.

  // Run the template's e2e smoke spec. Playwright's webServer auto-starts
  // `pnpm dev --port=<E2E_PORT>` and tears it down when the test process exits.
  await runInDir("pnpm test:e2e", projectDir, {
    timeout: 300_000,
    env,
  });

  // Clean up the workspace immediately to keep disk usage bounded when the
  // full suite runs (each workspace is ~500MB with node_modules).
  fs.rmSync(wsRoot, { recursive: true, force: true });
  const idx = tempDirs.indexOf(wsRoot);
  if (idx >= 0) tempDirs.splice(idx, 1);
}

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe.skipIf(!packagesBuilt)("scaffold smoke", () => {
  it(
    "e2e smoke passes with no features",
    async () => {
      await scaffoldAndSmoke({}, "smoke-minimal");
    },
    600_000,
  );

  it(
    "e2e smoke passes with db + auth + ui",
    async () => {
      await scaffoldAndSmoke({ db: true, auth: true, ui: true }, "smoke-db-auth-ui");
    },
    600_000,
  );

  it(
    "e2e smoke passes with all features",
    async () => {
      await scaffoldAndSmoke(
        { db: true, auth: true, ui: true, admin: true, storage: true, email: true },
        "smoke-all",
      );
    },
    600_000,
  );
});
