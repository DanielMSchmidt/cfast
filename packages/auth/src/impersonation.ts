export type ImpersonationManagerOptions = {
  tableName?: string;
  adminIdColumn?: string;
  targetUserIdColumn?: string;
};

export function createImpersonationManager(
  d1: D1Database,
  options?: ImpersonationManagerOptions,
) {
  const table = options?.tableName ?? "impersonation_logs";
  const adminCol = options?.adminIdColumn ?? "admin_id";
  const targetCol = options?.targetUserIdColumn ?? "target_user_id";

  return {
    async impersonate(
      adminUserId: string,
      targetUserId: string,
    ): Promise<void> {
      const id = crypto.randomUUID();
      const now = Date.now();
      await d1
        .prepare(
          `INSERT INTO ${table} (id, ${adminCol}, ${targetCol}, started_at) VALUES (?, ?, ?, ?)`,
        )
        .bind(id, adminUserId, targetUserId, now)
        .run();
    },

    async stopImpersonating(adminUserId: string): Promise<void> {
      const now = Date.now();
      await d1
        .prepare(
          `UPDATE ${table} SET ended_at = ? WHERE ${adminCol} = ? AND ended_at IS NULL`,
        )
        .bind(now, adminUserId)
        .run();
    },

    async getActiveImpersonation(
      adminUserId: string,
    ): Promise<{ targetUserId: string } | null> {
      const result = await d1
        .prepare(
          `SELECT ${targetCol} as target_user_id FROM ${table} WHERE ${adminCol} = ? AND ended_at IS NULL LIMIT 1`,
        )
        .bind(adminUserId)
        .first<{ target_user_id: string }>();

      return result ? { targetUserId: result.target_user_id } : null;
    },
  };
}
