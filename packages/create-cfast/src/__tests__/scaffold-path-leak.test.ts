/**
 * Regression tests for #162: the scaffolded app must never embed the raw
 * absolute input path (e.g. `/Users/you/projects/my-app` or `/tmp/...`)
 * into any file that ships to users. Earlier fixes (#97, #132, #171)
 * routed most surfaces through `path.basename(path.resolve(rawInput))`
 * as `config.projectName`, but there was no automated guard to catch a
 * regression where a future template author hardcodes an absolute path
 * or reverts to using the raw `targetDir` as a user-facing string.
 *
 * These tests are fast (< 500ms total) because they never touch
 * `pnpm install`. They scaffold into a temp dir, walk the output tree,
 * and grep for known-bad path shapes.
 */
import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Config, Features } from "../types";
import { scaffold } from "../scaffold";
import { resolveConfig } from "../config";
import { getTemplatesDir } from "../utils";

const tempDirs: string[] = [];

function scaffoldAt(label: string, features: Partial<Features>): string {
  const wsRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), `cfast-pathleak-${label}-`),
  );
  const targetDir = path.join(wsRoot, `test-${label}`);
  fs.mkdirSync(targetDir, { recursive: true });
  tempDirs.push(wsRoot);

  const config: Config = {
    projectName: `test-${label}`,
    // Intentionally pass an ABSOLUTE path as `targetDir` so we can assert
    // downstream that the scaffolded files never embed that path.
    targetDir,
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

  scaffold(resolveConfig(config));
  return targetDir;
}

/** Walks every text file under `dir` and yields its content. */
function* walk(
  dir: string,
): Generator<{ file: string; content: string }> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(full);
      if (
        ![
          ".ts",
          ".tsx",
          ".js",
          ".json",
          ".toml",
          ".md",
          ".html",
          ".css",
          "",
        ].includes(ext) &&
        !full.endsWith(".gitignore")
      ) {
        continue;
      }
      try {
        yield { file: full, content: fs.readFileSync(full, "utf-8") };
      } catch {
        // binary — skip
      }
    }
  }
}

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// The scaffolded e2e smoke spec intentionally references `/Users/` and
// `/home/` inside string literals as assertion targets — it fails a page
// request if the body contains those shapes. Skip it everywhere.
const SMOKE_SPEC_REL = path.join("e2e", "smoke.spec.ts");

describe("scaffolded files never leak absolute filesystem paths (#162)", () => {
  // Shapes that could only appear if we accidentally emitted `targetDir`
  // (absolute) instead of `projectName` (basename).
  const PATH_PATTERNS = [
    /\/Users\//,
    /\/home\/[a-z]/,
    /\/tmp\/cfast-pathleak-/,
    /\bC:\\[A-Za-z]/,
  ];

  it.each([
    ["minimal", {}],
    ["db-only", { db: true }],
    ["db-ui-auth", { db: true, ui: true, auth: true }],
    ["all", {
      db: true,
      auth: true,
      ui: true,
      admin: true,
      storage: true,
      email: true,
    }],
  ] as const)("does not leak paths with features: %s", (label, features) => {
    const targetDir = scaffoldAt(label, features);

    const offenders: Array<{ file: string; line: string }> = [];
    for (const { file, content } of walk(targetDir)) {
      const rel = path.relative(targetDir, file);
      if (rel === SMOKE_SPEC_REL) continue;
      const lines = content.split("\n");
      for (const line of lines) {
        if (PATH_PATTERNS.some((p) => p.test(line))) {
          offenders.push({ file: rel, line });
        }
      }
    }

    expect(
      offenders,
      `Scaffolded files leak an absolute filesystem path — likely a template uses the raw targetDir instead of {{projectName}}. Offenders:\n${offenders
        .map((o) => `  ${o.file}: ${o.line.trim()}`)
        .join("\n")}`,
    ).toEqual([]);
  });

  it("template files under templates/ never embed absolute paths on disk", () => {
    // Belt-and-braces: walk the checked-in templates directly and assert
    // no raw `/Users/` / `/home/` strings have been committed. This catches
    // the failure mode where a template author pastes an absolute path
    // out of their editor before the scaffolder's replacement runs.
    const templatesDir = getTemplatesDir();
    const offenders: Array<{ file: string; line: string }> = [];
    for (const { file, content } of walk(templatesDir)) {
      const rel = path.relative(templatesDir, file);
      if (rel.endsWith(SMOKE_SPEC_REL)) continue;
      const lines = content.split("\n");
      for (const line of lines) {
        if (/\/Users\//.test(line) || /\/home\/[a-z]/.test(line)) {
          offenders.push({ file: rel, line });
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("visible UI surfaces use the basename-derived projectName", () => {
    // Simulates the CLI path where the user passes an absolute target
    // dir (`node create-cfast /tmp/some-project`) and the CLI derives
    // `projectName = path.basename(path.resolve(rawInput))`. Every file
    // listed in #162 must render the basename, never the full path.
    const targetDir = scaffoldAt("visible-ui", {
      db: true,
      auth: true,
      ui: true,
      email: true,
    });

    // app/routes/_index.tsx — <title> and <h1>
    const indexTsx = fs.readFileSync(
      path.join(targetDir, "app", "routes", "_index.tsx"),
      "utf-8",
    );
    expect(indexTsx).toContain("test-visible-ui");

    // app/routes/login.tsx — "Sign in to <project>" subtitle
    const loginTsx = fs.readFileSync(
      path.join(targetDir, "app", "routes", "login.tsx"),
      "utf-8",
    );
    expect(loginTsx).toContain("Sign in to test-visible-ui");

    // app/components/Header.tsx — app title link
    const headerTsx = fs.readFileSync(
      path.join(targetDir, "app", "components", "Header.tsx"),
      "utf-8",
    );
    expect(headerTsx).toContain("test-visible-ui");

    // app/email.server.ts — `from:` header
    const emailServer = fs.readFileSync(
      path.join(targetDir, "app", "email.server.ts"),
      "utf-8",
    );
    expect(emailServer).toContain("test-visible-ui <noreply@");

    // app/email/send.ts — welcome email subject
    const sendTs = fs.readFileSync(
      path.join(targetDir, "app", "email", "send.ts"),
      "utf-8",
    );
    expect(sendTs).toContain("Welcome to test-visible-ui!");

    // app/email/templates/magic-link.tsx — body
    const magicLink = fs.readFileSync(
      path.join(targetDir, "app", "email", "templates", "magic-link.tsx"),
      "utf-8",
    );
    expect(magicLink).toContain("Sign in to test-visible-ui");

    // app/email/templates/welcome.tsx — body
    const welcome = fs.readFileSync(
      path.join(targetDir, "app", "email", "templates", "welcome.tsx"),
      "utf-8",
    );
    expect(welcome).toContain("Welcome to test-visible-ui!");

    // app/auth.setup.server.ts — "Sign in to <project>" email subject
    const authSetup = fs.readFileSync(
      path.join(targetDir, "app", "auth.setup.server.ts"),
      "utf-8",
    );
    expect(authSetup).toContain("Sign in to test-visible-ui");
  });
});
