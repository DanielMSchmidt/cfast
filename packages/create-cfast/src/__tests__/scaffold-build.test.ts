import { describe, it, afterAll, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { Features } from "../types";
import {
  packagesBuilt,
  runInDir,
  scaffoldAndBuild as scaffoldAndBuildBase,
} from "./scaffold-test-helpers";

const tempDirs: string[] = [];

async function scaffoldAndBuild(
  features: Partial<Features>,
  label: string,
): Promise<string> {
  const { wsRoot } = await scaffoldAndBuildBase(features, label, tempDirs);
  return wsRoot;
}

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

  // Regression for #174: fresh clone has no `worker-configuration.d.ts`
  // (it's gitignored) but tsconfig.cloudflare.json includes it. `pnpm
  // typecheck` must regenerate it automatically via `wrangler types`.
  it("typecheck regenerates worker-configuration.d.ts on fresh checkout", async () => {
    const wsRoot = await scaffoldAndBuild({}, "typecheck-regen");
    const projectDir = path.join(wsRoot, "app");
    const workerTypesPath = path.join(projectDir, "worker-configuration.d.ts");

    // Simulate a fresh clone: delete the generated types file if it exists
    // (wrangler may have created it during the build run above).
    if (fs.existsSync(workerTypesPath)) {
      fs.rmSync(workerTypesPath);
    }
    expect(fs.existsSync(workerTypesPath)).toBe(false);

    // Typecheck should self-heal by running `wrangler types` first.
    await runInDir("pnpm typecheck", projectDir, { timeout: 180_000 });

    expect(fs.existsSync(workerTypesPath)).toBe(true);
  }, 240_000);
});
