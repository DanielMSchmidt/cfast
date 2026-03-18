import { describe, it, expect } from "vitest";
import { can } from "../can";
import { definePermissions } from "../define-permissions";
import { resolveGrants } from "../resolve-grants";
import { grant } from "../grant";

import type { DrizzleTable } from "../types";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");
const posts: DrizzleTable = { [DRIZZLE_NAME]: "posts" };
const comments: DrizzleTable = { [DRIZZLE_NAME]: "comments" };
const auditLogs: DrizzleTable = { [DRIZZLE_NAME]: "audit_logs" };

const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,
  hierarchy: {
    user: ["anonymous"],
    editor: ["user"],
    admin: ["editor"],
  },
  grants: {
    anonymous: [grant("read", posts)],
    user: [grant("create", posts), grant("create", comments)],
    editor: [grant("update", posts), grant("delete", posts)],
    admin: [grant("manage", "all")],
  },
});

function grantsFor(role: string) {
  return resolveGrants(permissions, [role]);
}

describe("can", () => {
  it("returns true when grants include the exact action+table", () => {
    expect(can(grantsFor("user"), "create", posts)).toBe(true);
  });

  it("returns false when grants lack the action", () => {
    expect(can(grantsFor("anonymous"), "create", posts)).toBe(false);
  });

  it("returns true for inherited grants via hierarchy", () => {
    expect(can(grantsFor("user"), "read", posts)).toBe(true);
  });

  it("returns true when manage grant covers the action", () => {
    expect(can(grantsFor("admin"), "delete", auditLogs)).toBe(true);
  });

  it("returns true when 'all' subject matches any table", () => {
    expect(can(grantsFor("admin"), "create", comments)).toBe(true);
  });

  it("returns false for unrelated table", () => {
    expect(can(grantsFor("anonymous"), "read", auditLogs)).toBe(false);
  });

  it("returns false for empty grants array", () => {
    expect(can([], "read", posts)).toBe(false);
  });
});
