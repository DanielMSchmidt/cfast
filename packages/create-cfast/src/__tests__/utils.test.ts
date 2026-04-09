import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  copyDir,
  replaceInDir,
  readJsonFragment,
  readTextFragment,
  writeFile,
} from "../utils";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cfast-utils-test-"));
}

// ---------------------------------------------------------------------------
// copyDir
// ---------------------------------------------------------------------------

describe("copyDir", () => {
  it("copies files and creates the destination directory", () => {
    const src = makeTmpDir();
    const dest = path.join(makeTmpDir(), "nested", "output");

    fs.writeFileSync(path.join(src, "hello.ts"), "export const x = 1;");
    copyDir(src, dest);

    expect(fs.existsSync(path.join(dest, "hello.ts"))).toBe(true);
    expect(fs.readFileSync(path.join(dest, "hello.ts"), "utf-8")).toBe(
      "export const x = 1;",
    );
  });

  it("renames _gitignore to .gitignore", () => {
    const src = makeTmpDir();
    const dest = makeTmpDir();

    fs.writeFileSync(path.join(src, "_gitignore"), "node_modules/");
    copyDir(src, dest);

    expect(fs.existsSync(path.join(dest, ".gitignore"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "_gitignore"))).toBe(false);
  });

  it("skips package.json files (handled by merger)", () => {
    const src = makeTmpDir();
    const dest = makeTmpDir();

    fs.writeFileSync(path.join(src, "package.json"), '{"name":"test"}');
    fs.writeFileSync(path.join(src, "index.ts"), "export {}");
    copyDir(src, dest);

    expect(fs.existsSync(path.join(dest, "package.json"))).toBe(false);
    expect(fs.existsSync(path.join(dest, "index.ts"))).toBe(true);
  });

  it("skips wrangler.toml files (handled by generator)", () => {
    const src = makeTmpDir();
    const dest = makeTmpDir();

    fs.writeFileSync(path.join(src, "wrangler.toml"), "[env]");
    fs.writeFileSync(path.join(src, "readme.md"), "# Hello");
    copyDir(src, dest);

    expect(fs.existsSync(path.join(dest, "wrangler.toml"))).toBe(false);
    expect(fs.existsSync(path.join(dest, "readme.md"))).toBe(true);
  });

  it("recursively copies subdirectories", () => {
    const src = makeTmpDir();
    const dest = makeTmpDir();

    fs.mkdirSync(path.join(src, "subdir"));
    fs.writeFileSync(path.join(src, "subdir", "file.ts"), "export {}");
    copyDir(src, dest);

    expect(fs.existsSync(path.join(dest, "subdir", "file.ts"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// replaceInDir
// ---------------------------------------------------------------------------

describe("replaceInDir", () => {
  it("replaces {{key}} template markers in .ts files", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, "app.ts"), 'const name = "{{projectName}}";');

    replaceInDir(dir, { projectName: "my-cool-app" });

    const content = fs.readFileSync(path.join(dir, "app.ts"), "utf-8");
    expect(content).toContain("my-cool-app");
    expect(content).not.toContain("{{projectName}}");
  });

  it("replaces markers in nested files", () => {
    const dir = makeTmpDir();
    fs.mkdirSync(path.join(dir, "app"));
    fs.writeFileSync(path.join(dir, "app", "env.ts"), "// {{projectName}}");

    replaceInDir(dir, { projectName: "nested-app" });

    const content = fs.readFileSync(path.join(dir, "app", "env.ts"), "utf-8");
    expect(content).toContain("nested-app");
    expect(content).not.toContain("{{projectName}}");
  });

  it("replaces markers in .toml files", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, "wrangler.toml"), 'name = "{{projectName}}"');

    replaceInDir(dir, { projectName: "wrangler-test" });

    const result = fs.readFileSync(path.join(dir, "wrangler.toml"), "utf-8");
    expect(result).toContain("wrangler-test");
  });

  it("leaves a file unchanged when no markers match", () => {
    const dir = makeTmpDir();
    const original = "export const x = 42;";
    fs.writeFileSync(path.join(dir, "unchanged.ts"), original);

    replaceInDir(dir, { projectName: "anything" });

    expect(fs.readFileSync(path.join(dir, "unchanged.ts"), "utf-8")).toBe(
      original,
    );
  });

  it("replaces multiple different markers in one file", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(
      path.join(dir, "multi.ts"),
      "// project: {{projectName}} version: {{version}}",
    );

    replaceInDir(dir, { projectName: "my-app", version: "1.0.0" });

    const content = fs.readFileSync(path.join(dir, "multi.ts"), "utf-8");
    expect(content).toContain("my-app");
    expect(content).toContain("1.0.0");
  });
});

// ---------------------------------------------------------------------------
// readJsonFragment
// ---------------------------------------------------------------------------

describe("readJsonFragment", () => {
  it("returns {} for a non-existent file", () => {
    expect(
      readJsonFragment("/tmp/definitely-does-not-exist-cfast.json"),
    ).toEqual({});
  });

  it("parses a real JSON file", () => {
    const file = path.join(makeTmpDir(), "pkg.json");
    fs.writeFileSync(file, JSON.stringify({ name: "test", version: "1.0.0" }));
    expect(readJsonFragment(file)).toEqual({ name: "test", version: "1.0.0" });
  });

  it("handles a JSON file with nested objects", () => {
    const file = path.join(makeTmpDir(), "nested.json");
    const data = { dependencies: { react: "^19.0.0" }, scripts: { dev: "vite" } };
    fs.writeFileSync(file, JSON.stringify(data));
    expect(readJsonFragment(file)).toEqual(data);
  });
});

// ---------------------------------------------------------------------------
// readTextFragment
// ---------------------------------------------------------------------------

describe("readTextFragment", () => {
  it("returns empty string for a non-existent file", () => {
    expect(readTextFragment("/tmp/definitely-missing-cfast.txt")).toBe("");
  });

  it("returns file contents as a string", () => {
    const file = path.join(makeTmpDir(), "fragment.toml");
    fs.writeFileSync(file, "[settings]\nfoo = true");
    expect(readTextFragment(file)).toBe("[settings]\nfoo = true");
  });
});

// ---------------------------------------------------------------------------
// writeFile
// ---------------------------------------------------------------------------

describe("writeFile", () => {
  it("creates intermediate directories", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "deep", "nested", "file.ts");
    writeFile(filePath, "export const x = 42;");

    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, "utf-8")).toBe("export const x = 42;");
  });

  it("overwrites an existing file", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "overwrite.ts");

    writeFile(filePath, "original");
    writeFile(filePath, "updated");

    expect(fs.readFileSync(filePath, "utf-8")).toBe("updated");
  });
});
