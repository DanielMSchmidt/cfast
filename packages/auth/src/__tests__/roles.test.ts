import { describe, it, expect } from "vitest";
import { createRoleManager } from "../roles";
import { createMockD1 } from "./helpers";

describe("createRoleManager", () => {
  it("getRoles sends correct SQL", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1);

    await rm.getRoles("user-1");

    expect(d1._calls).toHaveLength(1);
    expect(d1._calls[0].sql).toBe(
      "SELECT role FROM roles WHERE user_id = ?",
    );
    expect(d1._calls[0].params).toEqual(["user-1"]);
  });

  it("setRole uses INSERT OR IGNORE", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1);

    await rm.setRole("user-1", "admin");

    expect(d1._calls).toHaveLength(1);
    expect(d1._calls[0].sql).toBe(
      "INSERT OR IGNORE INTO roles (user_id, role) VALUES (?, ?)",
    );
    expect(d1._calls[0].params).toEqual(["user-1", "admin"]);
  });

  it("setRoles deletes existing then inserts new roles", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1);

    await rm.setRoles("user-1", ["editor", "admin"]);

    expect(d1._calls).toHaveLength(3);

    // First call: DELETE existing roles
    expect(d1._calls[0].sql).toBe(
      "DELETE FROM roles WHERE user_id = ?",
    );
    expect(d1._calls[0].params).toEqual(["user-1"]);

    // Second call: INSERT editor
    expect(d1._calls[1].sql).toBe(
      "INSERT INTO roles (user_id, role) VALUES (?, ?)",
    );
    expect(d1._calls[1].params).toEqual(["user-1", "editor"]);

    // Third call: INSERT admin
    expect(d1._calls[2].sql).toBe(
      "INSERT INTO roles (user_id, role) VALUES (?, ?)",
    );
    expect(d1._calls[2].params).toEqual(["user-1", "admin"]);
  });

  it("setRoles with empty array only deletes", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1);

    await rm.setRoles("user-1", []);

    expect(d1._calls).toHaveLength(1);
    expect(d1._calls[0].sql).toBe(
      "DELETE FROM roles WHERE user_id = ?",
    );
  });

  it("removeRole sends correct SQL", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1);

    await rm.removeRole("user-1", "admin");

    expect(d1._calls).toHaveLength(1);
    expect(d1._calls[0].sql).toBe(
      "DELETE FROM roles WHERE user_id = ? AND role = ?",
    );
    expect(d1._calls[0].params).toEqual(["user-1", "admin"]);
  });

  it("uses custom table name when provided", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { tableName: "cfast_roles" });

    await rm.getRoles("user-1");

    expect(d1._calls[0].sql).toBe(
      "SELECT role FROM cfast_roles WHERE user_id = ?",
    );
  });

  it("uses custom table name in setRole", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { tableName: "app_roles" });

    await rm.setRole("user-1", "admin");

    expect(d1._calls[0].sql).toBe(
      "INSERT OR IGNORE INTO app_roles (user_id, role) VALUES (?, ?)",
    );
  });

  it("uses custom table name in setRoles", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { tableName: "user_roles" });

    await rm.setRoles("user-1", ["editor"]);

    expect(d1._calls[0].sql).toBe(
      "DELETE FROM user_roles WHERE user_id = ?",
    );
    expect(d1._calls[1].sql).toBe(
      "INSERT INTO user_roles (user_id, role) VALUES (?, ?)",
    );
  });

  it("uses custom table name in removeRole", async () => {
    const d1 = createMockD1();
    const rm = createRoleManager(d1, { tableName: "custom_roles" });

    await rm.removeRole("user-1", "admin");

    expect(d1._calls[0].sql).toBe(
      "DELETE FROM custom_roles WHERE user_id = ? AND role = ?",
    );
  });
});
