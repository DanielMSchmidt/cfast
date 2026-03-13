/**
 * Options for configuring the role manager's storage and authorization rules.
 */
export type RoleManagerOptions = {
  /** Custom table name for role storage. Defaults to `"roles"`. */
  tableName?: string;
  /** Maps each role to the roles it is allowed to assign. Used to enforce role grant rules. */
  roleGrants?: Record<string, string[]>;
};

/** Options identifying the caller for role grant authorization checks. */
type CallerOptions = {
  /** The roles of the user attempting the role assignment. */
  callerRoles?: string[];
};

/**
 * Validates that the caller's roles permit assigning the target role.
 *
 * @param roleGrants - The role-to-assignable-roles mapping.
 * @param callerRoles - The roles of the user performing the assignment.
 * @param targetRole - The role being assigned.
 * @throws {Error} If none of the caller's roles permit assigning the target role.
 */
function checkRoleGrants(
  roleGrants: Record<string, string[]>,
  callerRoles: string[],
  targetRole: string,
): void {
  const allowed = callerRoles.some((callerRole) => {
    const permitted = roleGrants[callerRole];
    return permitted !== undefined && permitted.includes(targetRole);
  });

  if (!allowed) {
    throw new Error(
      `Not authorized to assign role "${targetRole}"`,
    );
  }
}

/**
 * Creates a role manager backed by a Cloudflare D1 database.
 *
 * Provides methods to query, assign, replace, and remove user roles.
 * When `roleGrants` is configured, assignment methods enforce authorization
 * rules so that, for example, an editor cannot promote someone to admin.
 *
 * @param d1 - The Cloudflare D1 database binding.
 * @param options - Optional configuration for table name and role grant rules.
 * @returns An object with `getRoles`, `setRole`, `setRoles`, and `removeRole` methods.
 *
 * @example
 * ```ts
 * import { createRoleManager } from "@cfast/auth";
 *
 * const roles = createRoleManager(env.DB, {
 *   roleGrants: {
 *     admin: ["admin", "editor", "user"],
 *     editor: ["user"],
 *   },
 * });
 *
 * const userRoles = await roles.getRoles(userId);
 * await roles.setRole(userId, "editor", { callerRoles: ["admin"] });
 * ```
 */
export function createRoleManager(d1: D1Database, options?: RoleManagerOptions) {
  const table = options?.tableName ?? "roles";
  const roleGrants = options?.roleGrants;

  return {
    async getRoles(userId: string): Promise<string[]> {
      const stmt = d1.prepare(
        `SELECT role FROM ${table} WHERE user_id = ?`,
      );
      const result = await stmt.bind(userId).all<{ role: string }>();
      return result.results.map((r: { role: string }) => r.role);
    },

    async setRole(
      userId: string,
      role: string,
      caller?: CallerOptions,
    ): Promise<void> {
      if (roleGrants && caller?.callerRoles) {
        checkRoleGrants(roleGrants, caller.callerRoles, role);
      }

      const stmt = d1.prepare(
        `INSERT OR IGNORE INTO ${table} (user_id, role) VALUES (?, ?)`,
      );
      await stmt.bind(userId, role).run();
    },

    async setRoles(
      userId: string,
      roles: string[],
      caller?: CallerOptions,
    ): Promise<void> {
      if (roleGrants && caller?.callerRoles) {
        for (const role of roles) {
          checkRoleGrants(roleGrants, caller.callerRoles, role);
        }
      }

      const deleteStmt = d1
        .prepare(`DELETE FROM ${table} WHERE user_id = ?`)
        .bind(userId);

      if (roles.length === 0) {
        await deleteStmt.run();
        return;
      }

      const insertStmts = roles.map((role) =>
        d1
          .prepare(`INSERT INTO ${table} (user_id, role) VALUES (?, ?)`)
          .bind(userId, role),
      );

      await d1.batch([deleteStmt, ...insertStmts]);
    },

    async removeRole(userId: string, role: string): Promise<void> {
      const stmt = d1.prepare(
        `DELETE FROM ${table} WHERE user_id = ? AND role = ?`,
      );
      await stmt.bind(userId, role).run();
    },
  };
}
