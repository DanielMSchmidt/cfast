import { describe, it, expect } from "vitest";
import { resolveFeatureDeps, resolveConfig } from "../config";

describe("resolveFeatureDeps", () => {
  it("returns features unchanged when no deps needed", () => {
    const features = { auth: false, db: true, storage: false, email: false, ui: false, admin: false };
    const result = resolveFeatureDeps(features);
    expect(result).toEqual(features);
  });

  it("auth implies db", () => {
    const features = { auth: true, db: false, storage: false, email: false, ui: false, admin: false };
    const result = resolveFeatureDeps(features);
    expect(result.db).toBe(true);
    expect(result.auth).toBe(true);
  });

  it("admin implies db, ui, auth", () => {
    const features = { auth: false, db: false, storage: false, email: false, ui: false, admin: true };
    const result = resolveFeatureDeps(features);
    expect(result.db).toBe(true);
    expect(result.ui).toBe(true);
    expect(result.auth).toBe(true);
    expect(result.admin).toBe(true);
  });

  it("admin transitively implies db via auth", () => {
    const features = { auth: false, db: false, storage: false, email: false, ui: false, admin: true };
    const result = resolveFeatureDeps(features);
    expect(result.db).toBe(true);
  });
});

describe("resolveConfig", () => {
  it("sets uiLibrary to null when ui not selected", () => {
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { auth: false, db: false, storage: false, email: false, ui: false, admin: false },
      uiLibrary: null,
    });
    expect(config.uiLibrary).toBeNull();
  });

  it("defaults uiLibrary to joy when ui selected and no preference", () => {
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { auth: false, db: false, storage: false, email: false, ui: true, admin: false },
      uiLibrary: null,
    });
    expect(config.uiLibrary).toBe("joy");
  });

  it("resolves feature deps", () => {
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { auth: true, db: false, storage: false, email: false, ui: false, admin: false },
      uiLibrary: null,
    });
    expect(config.features.db).toBe(true);
  });
});
