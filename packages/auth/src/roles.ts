export function createRoleManager(d1: D1Database) {
  return {
    async getRoles(userId: string): Promise<string[]> {
      const stmt = d1.prepare(
        "SELECT role FROM roles WHERE user_id = ?",
      );
      const result = await stmt.bind(userId).all<{ role: string }>();
      return result.results.map((r) => r.role);
    },

    async setRole(userId: string, role: string): Promise<void> {
      const stmt = d1.prepare(
        "INSERT OR IGNORE INTO roles (user_id, role) VALUES (?, ?)",
      );
      await stmt.bind(userId, role).run();
    },

    async setRoles(userId: string, roles: string[]): Promise<void> {
      const deleteStmt = d1
        .prepare("DELETE FROM roles WHERE user_id = ?")
        .bind(userId);

      if (roles.length === 0) {
        await deleteStmt.run();
        return;
      }

      const insertStmts = roles.map((role) =>
        d1
          .prepare("INSERT INTO roles (user_id, role) VALUES (?, ?)")
          .bind(userId, role),
      );

      await d1.batch([deleteStmt, ...insertStmts]);
    },

    async removeRole(userId: string, role: string): Promise<void> {
      const stmt = d1.prepare(
        "DELETE FROM roles WHERE user_id = ? AND role = ?",
      );
      await stmt.bind(userId, role).run();
    },
  };
}
