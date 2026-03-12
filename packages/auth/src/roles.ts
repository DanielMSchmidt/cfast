export type RoleManagerOptions = {
  tableName?: string;
  roleGrants?: Record<string, string[]>;
};

type CallerOptions = {
  callerRoles?: string[];
};

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
