/**
 * Options for customizing the impersonation manager's D1 table and column names.
 */
export type ImpersonationManagerOptions = {
  /** Custom table name for impersonation logs. Defaults to `"impersonation_logs"`. */
  tableName?: string;
  /** Column name for the admin user ID. Defaults to `"admin_id"`. */
  adminIdColumn?: string;
  /** Column name for the target (impersonated) user ID. Defaults to `"target_user_id"`. */
  targetUserIdColumn?: string;
};

/**
 * Creates an impersonation manager backed by a Cloudflare D1 database.
 *
 * Manages an audit trail of impersonation sessions, allowing admins to
 * temporarily act as another user for debugging and support. Each session
 * is logged with start and end timestamps.
 *
 * @param d1 - The Cloudflare D1 database binding.
 * @param options - Optional configuration for table and column names.
 * @returns An object with `impersonate`, `stopImpersonating`, and `getActiveImpersonation` methods.
 *
 * @example
 * ```ts
 * import { createImpersonationManager } from "@cfast/auth";
 *
 * const impersonation = createImpersonationManager(env.DB);
 *
 * // Start impersonating a user
 * await impersonation.impersonate(adminUserId, targetUserId);
 *
 * // Check if admin is currently impersonating someone
 * const active = await impersonation.getActiveImpersonation(adminUserId);
 * // active?.targetUserId
 *
 * // Stop impersonating
 * await impersonation.stopImpersonating(adminUserId);
 * ```
 */
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
