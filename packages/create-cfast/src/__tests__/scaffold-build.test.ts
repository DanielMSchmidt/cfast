import { describe, it, afterAll } from "vitest";
import fs from "node:fs";
import type { Features } from "../types";
import {
  packagesBuilt,
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
});
