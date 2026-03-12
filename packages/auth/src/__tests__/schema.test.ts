import { describe, it, expect } from "vitest";
import {
  users,
  sessions,
  accounts,
  verifications,
  passkeys,
  roles,
  impersonationLogs,
} from "../schema";
import { getTableName } from "drizzle-orm";

describe("auth schema", () => {
  it("exports all required tables", () => {
    expect(users).toBeDefined();
    expect(sessions).toBeDefined();
    expect(accounts).toBeDefined();
    expect(verifications).toBeDefined();
    expect(passkeys).toBeDefined();
    expect(roles).toBeDefined();
    expect(impersonationLogs).toBeDefined();
  });

  it("uses correct table names", () => {
    expect(getTableName(users)).toBe("users");
    expect(getTableName(sessions)).toBe("sessions");
    expect(getTableName(accounts)).toBe("accounts");
    expect(getTableName(verifications)).toBe("verifications");
    expect(getTableName(passkeys)).toBe("passkeys");
    expect(getTableName(roles)).toBe("roles");
    expect(getTableName(impersonationLogs)).toBe("impersonation_logs");
  });

  it("users table has required columns", () => {
    const cols = Object.keys(users);
    expect(cols).toContain("id");
    expect(cols).toContain("email");
    expect(cols).toContain("name");
    expect(cols).toContain("image");
    expect(cols).toContain("emailVerified");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });

  it("sessions table has required columns", () => {
    const cols = Object.keys(sessions);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("token");
    expect(cols).toContain("expiresAt");
  });

  it("accounts table has required columns", () => {
    const cols = Object.keys(accounts);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("accountId");
    expect(cols).toContain("providerId");
  });

  it("passkeys table has required columns", () => {
    const cols = Object.keys(passkeys);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("publicKey");
    expect(cols).toContain("credentialId");
  });

  it("roles table has userId and role columns", () => {
    const cols = Object.keys(roles);
    expect(cols).toContain("userId");
    expect(cols).toContain("role");
  });

  it("impersonationLogs has required audit columns", () => {
    const cols = Object.keys(impersonationLogs);
    expect(cols).toContain("id");
    expect(cols).toContain("adminId");
    expect(cols).toContain("targetUserId");
    expect(cols).toContain("startedAt");
    expect(cols).toContain("endedAt");
  });
});
