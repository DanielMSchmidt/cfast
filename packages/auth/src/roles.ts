export function createRoleManager(d1: D1Database) {
  return {
    async getRoles(userId: string): Promise<string[]> {
      const stmt = d1.prepare(
        "SELECT role FROM cfast_roles WHERE user_id = ?",
      );
      const result = await stmt.bind(userId).all<{ role: string }>();
      return result.results.map((r) => r.role);
    },

    async setRole(userId: string, role: string): Promise<void> {
      const stmt = d1.prepare(
        "INSERT OR IGNORE INTO cfast_roles (user_id, role) VALUES (?, ?)",
      );
      await stmt.bind(userId, role).run();
    },

    async setRoles(userId: string, roles: string[]): Promise<void> {
      const deleteStmt = d1.prepare(
        "DELETE FROM cfast_roles WHERE user_id = ?",
      );
      await deleteStmt.bind(userId).run();

      for (const role of roles) {
        const insertStmt = d1.prepare(
          "INSERT INTO cfast_roles (user_id, role) VALUES (?, ?)",
        );
        await insertStmt.bind(userId, role).run();
      }
    },

    async removeRole(userId: string, role: string): Promise<void> {
      const stmt = d1.prepare(
        "DELETE FROM cfast_roles WHERE user_id = ? AND role = ?",
      );
      await stmt.bind(userId, role).run();
    },
  };
}
