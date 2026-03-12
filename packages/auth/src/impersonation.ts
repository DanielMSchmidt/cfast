export type ImpersonationManagerOptions = {
  tableName?: string;
};

export function createImpersonationManager(
  d1: D1Database,
  options?: ImpersonationManagerOptions,
) {
  const table = options?.tableName ?? "impersonation_log";

  return {
    async impersonate(
      adminUserId: string,
      targetUserId: string,
    ): Promise<void> {
      const id = crypto.randomUUID();
      const now = Date.now();
      await d1
        .prepare(
          `INSERT INTO ${table} (id, admin_user_id, target_user_id, started_at) VALUES (?, ?, ?, ?)`,
        )
        .bind(id, adminUserId, targetUserId, now)
        .run();
    },

    async stopImpersonating(adminUserId: string): Promise<void> {
      const now = Date.now();
      await d1
        .prepare(
          `UPDATE ${table} SET ended_at = ? WHERE admin_user_id = ? AND ended_at IS NULL`,
        )
        .bind(now, adminUserId)
        .run();
    },

    async getActiveImpersonation(
      adminUserId: string,
    ): Promise<{ targetUserId: string } | null> {
      const result = await d1
        .prepare(
          `SELECT target_user_id FROM ${table} WHERE admin_user_id = ? AND ended_at IS NULL LIMIT 1`,
        )
        .bind(adminUserId)
        .first<{ target_user_id: string }>();

      return result ? { targetUserId: result.target_user_id } : null;
    },
  };
}
