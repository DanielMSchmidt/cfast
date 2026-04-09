import { describe, it, expect } from "vitest";
import { getAutoAddedFeatures, resolveConfig } from "../config";

// ---------------------------------------------------------------------------
// getAutoAddedFeatures — not covered by the existing config.test.ts
// ---------------------------------------------------------------------------

describe("getAutoAddedFeatures", () => {
  const base = {
    auth: false,
    db: false,
    storage: false,
    email: false,
    ui: false,
    admin: false,
  };

  it("returns empty array when nothing changed", () => {
    expect(getAutoAddedFeatures(base, base)).toEqual([]);
  });

  it("reports keys that were auto-added by the cascade", () => {
    const original = { ...base, auth: true };
    const resolved = { ...base, auth: true, db: true, ui: true };
    const added = getAutoAddedFeatures(original, resolved);
    expect(added).toContain("db");
    expect(added).toContain("ui");
    expect(added).not.toContain("auth");
  });

  it("does not report explicitly-enabled features as auto-added", () => {
    // user turned on db explicitly AND admin turned on auth automatically
    const original = { ...base, admin: true, db: true };
    const resolved = { ...base, admin: true, db: true, auth: true, ui: true };
    const added = getAutoAddedFeatures(original, resolved);
    expect(added).not.toContain("db");
    expect(added).toContain("auth");
    expect(added).toContain("ui");
  });

  it("returns all cascaded features when admin is selected alone", () => {
    const original = { ...base, admin: true };
    const resolved = { ...base, admin: true, auth: true, db: true, ui: true };
    const added = getAutoAddedFeatures(original, resolved);
    expect(added.sort()).toEqual(["auth", "db", "ui"]);
  });
});

// ---------------------------------------------------------------------------
// resolveConfig — additional gaps
// ---------------------------------------------------------------------------

describe("resolveConfig — additional gaps", () => {
  const baseFeatures = {
    auth: false,
    db: false,
    storage: false,
    email: false,
    ui: false,
    admin: false,
  };

  it("preserves explicit 'headless' uiLibrary when ui is enabled", () => {
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { ...baseFeatures, ui: true },
      uiLibrary: "headless",
    });
    expect(config.uiLibrary).toBe("headless");
  });

  it("sets uiLibrary to null even when 'joy' was provided but ui is not enabled", () => {
    // Passing uiLibrary: 'joy' but ui: false — resolveConfig must clear it
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { ...baseFeatures },
      uiLibrary: "joy",
    });
    expect(config.uiLibrary).toBeNull();
  });

  it("resolves uiLibrary to 'joy' by default when auth cascades ui", () => {
    // auth cascades to ui=true, but no explicit uiLibrary provided
    const config = resolveConfig({
      projectName: "test",
      targetDir: "/tmp/test",
      features: { ...baseFeatures, auth: true },
      uiLibrary: null,
    });
    expect(config.features.ui).toBe(true);
    expect(config.uiLibrary).toBe("joy");
  });

  it("preserves projectName and targetDir unchanged", () => {
    const config = resolveConfig({
      projectName: "my-special-app",
      targetDir: "/some/path",
      features: baseFeatures,
      uiLibrary: null,
    });
    expect(config.projectName).toBe("my-special-app");
    expect(config.targetDir).toBe("/some/path");
  });

  it("email alone does not trigger feature cascade", () => {
    const config = resolveConfig({
      projectName: "email-app",
      targetDir: "/tmp/email-app",
      features: { ...baseFeatures, email: true },
      uiLibrary: null,
    });
    expect(config.features.db).toBe(false);
    expect(config.features.auth).toBe(false);
    expect(config.features.ui).toBe(false);
  });

  it("storage alone does not trigger feature cascade", () => {
    const config = resolveConfig({
      projectName: "storage-app",
      targetDir: "/tmp/storage-app",
      features: { ...baseFeatures, storage: true },
      uiLibrary: null,
    });
    expect(config.features.db).toBe(false);
    expect(config.features.auth).toBe(false);
  });
});
