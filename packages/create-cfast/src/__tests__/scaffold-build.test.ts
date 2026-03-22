import { describe, it, afterAll } from "vitest";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scaffold } from "../scaffold";
import { resolveConfig } from "../config";
import type { Config, Features } from "../types";

const execAsync = promisify(exec);

const MONOREPO_ROOT = path.resolve(__dirname, "../../../..");

// These tests require all @cfast/* packages to be built (they symlink into
// the monorepo). Skip when running in filtered CI where only create-cfast is built.
const packagesBuilt = fs.existsSync(path.join(MONOREPO_ROOT, "packages/env/dist/index.js"));

const CFAST_PACKAGES: Record<string, string> = {
  "@cfast/core": path.join(MONOREPO_ROOT, "packages/core"),
  "@cfast/env": path.join(MONOREPO_ROOT, "packages/env"),
  "@cfast/permissions": path.join(MONOREPO_ROOT, "packages/permissions"),
  "@cfast/db": path.join(MONOREPO_ROOT, "packages/db"),
  "@cfast/auth": path.join(MONOREPO_ROOT, "packages/auth"),
  "@cfast/actions": path.join(MONOREPO_ROOT, "packages/actions"),
  "@cfast/ui": path.join(MONOREPO_ROOT, "packages/ui"),
  "@cfast/joy": path.join(MONOREPO_ROOT, "packages/joy"),
  "@cfast/forms": path.join(MONOREPO_ROOT, "packages/forms"),
  "@cfast/storage": path.join(MONOREPO_ROOT, "packages/storage"),
  "@cfast/email": path.join(MONOREPO_ROOT, "packages/email"),
  "@cfast/admin": path.join(MONOREPO_ROOT, "packages/admin"),
  "@cfast/pagination": path.join(MONOREPO_ROOT, "packages/pagination"),
};

function rewriteCfastDeps(projectDir: string): void {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  for (const section of ["dependencies", "devDependencies"] as const) {
    if (!pkg[section]) continue;
    for (const name of Object.keys(pkg[section])) {
      if (CFAST_PACKAGES[name]) {
        pkg[section][name] = "workspace:*";
      }
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

function setupWorkspace(features: Partial<Features>, label: string): string {
  const wsRoot = fs.mkdtempSync(path.join(os.tmpdir(), `cfast-test-${label}-`));
  const projectDir = path.join(wsRoot, "app");
  fs.mkdirSync(projectDir, { recursive: true });

  const config: Config = {
    projectName: `test-${label}`,
    targetDir: projectDir,
    features: {
      auth: false,
      db: false,
      storage: false,
      email: false,
      ui: false,
      admin: false,
      ...features,
    },
    uiLibrary: null,
  };

  const resolved = resolveConfig(config);
  scaffold(resolved);

  // Symlink monorepo packages into workspace
  const pkgsDir = path.join(wsRoot, "packages");
  fs.mkdirSync(pkgsDir, { recursive: true });
  for (const [, pkgPath] of Object.entries(CFAST_PACKAGES)) {
    const pkgName = path.basename(pkgPath);
    fs.symlinkSync(pkgPath, path.join(pkgsDir, pkgName));
  }

  // Create workspace config
  fs.writeFileSync(
    path.join(wsRoot, "pnpm-workspace.yaml"),
    "packages:\n  - app\n  - packages/*\n",
  );

  // Create root package.json
  fs.writeFileSync(
    path.join(wsRoot, "package.json"),
    JSON.stringify({ name: `test-ws-${label}`, private: true }, null, 2) + "\n",
  );

  rewriteCfastDeps(projectDir);

  return wsRoot;
}

async function runInDir(cmd: string, cwd: string): Promise<void> {
  try {
    await execAsync(cmd, { cwd, timeout: 120_000 });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    throw new Error(`Command failed: ${cmd}\n${e.stdout ?? ""}\n${e.stderr ?? ""}`, { cause: err });
  }
}

async function scaffoldAndBuild(features: Partial<Features>, label: string): Promise<string> {
  const wsRoot = setupWorkspace(features, label);
  tempDirs.push(wsRoot);

  await runInDir("pnpm install --no-frozen-lockfile", wsRoot);
  await runInDir(`pnpm --filter test-${label} build`, wsRoot);

  return wsRoot;
}

const tempDirs: string[] = [];

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe.skipIf(!packagesBuilt)("scaffold build", () => {
  it("builds with no features", async () => {
    await scaffoldAndBuild({}, "minimal");
  }, 120_000);

  it("builds with db", async () => {
    await scaffoldAndBuild({ db: true }, "db");
  }, 120_000);

  it("builds with db + auth", async () => {
    await scaffoldAndBuild({ db: true, auth: true }, "db-auth");
  }, 120_000);

  it("builds with db + auth + ui", async () => {
    await scaffoldAndBuild({ db: true, auth: true, ui: true }, "db-auth-ui");
  }, 120_000);

  it("builds with admin (auto-resolves db, auth, ui)", async () => {
    await scaffoldAndBuild({ admin: true }, "admin");
  }, 120_000);

  it("builds with db + auth + storage", async () => {
    await scaffoldAndBuild({ db: true, auth: true, storage: true }, "db-auth-storage");
  }, 120_000);

  it("builds with db + auth + email", async () => {
    await scaffoldAndBuild({ db: true, auth: true, email: true }, "db-auth-email");
  }, 120_000);

  it("builds with all features", async () => {
    await scaffoldAndBuild(
      { db: true, auth: true, ui: true, admin: true, storage: true, email: true },
      "all",
    );
  }, 120_000);
});
