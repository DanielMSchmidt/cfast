import { describe, it, expect } from "vitest";
import { parseArgs } from "../args";

describe("parseArgs", () => {
  it("parses project name from positional arg", () => {
    const result = parseArgs(["my-app"]);
    expect(result.projectName).toBe("my-app");
  });

  it("returns undefined projectName when not provided", () => {
    const result = parseArgs([]);
    expect(result.projectName).toBeUndefined();
  });

  it("parses boolean feature flags", () => {
    const result = parseArgs(["my-app", "--auth", "--db"]);
    expect(result.auth).toBe(true);
    expect(result.db).toBe(true);
    expect(result.storage).toBe(false);
  });

  it("parses --all flag", () => {
    const result = parseArgs(["--all"]);
    expect(result.all).toBe(true);
  });

  it("parses --help flag", () => {
    const result = parseArgs(["--help"]);
    expect(result.help).toBe(true);
  });

  it("ignores unknown flags", () => {
    const result = parseArgs(["my-app", "--unknown"]);
    expect(result.projectName).toBe("my-app");
  });
});
