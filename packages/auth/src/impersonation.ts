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
 * Detects whether an unknown error thrown by a D1 query is the
 * "no such table: impersonation_logs" error SQLite raises when a
 * consumer has upgraded `@cfast/auth` but not yet run the migration
 * that creates the audit table.
 *
 * Matches both the raw SQLite text (`no such table`) and the
 * D1-wrapped variant (`D1_ERROR: no such table: …`) so we stay
 * resilient to wording tweaks on either side of the runtime.
 *
 * @internal
 */
function isMissingTableError(error: unknown, tableName: string): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("no such table") &&
    lower.includes(tableName.toLowerCase())
  );
}

/**
 * Logs a one-time warning pointing the consumer at the migration they
 * need to run to create the impersonation audit table.
 *
 * Deduped per `tableName` so a hot request path doesn't spam the logs
 * — the first authenticated request surfaces the problem, every
 * subsequent one falls through silently to the safe default.
 *
 * @internal
 */
const warnedTables = new Set<string>();
function warnMissingImpersonationTable(tableName: string): void {
  if (warnedTables.has(tableName)) return;
  warnedTables.add(tableName);
  console.warn(
    `[@cfast/auth] Impersonation audit table "${tableName}" does not exist. ` +
      `Treating as "no active impersonation" so authenticated requests still work, ` +
      `but impersonation features are DISABLED until you run the migration. ` +
      `Fix: add \`impersonationLogs\` from \`@cfast/auth/schema\` to your Drizzle ` +
      `schema and run \`pnpm db:generate && pnpm db:migrate:local\`. ` +
      `See https://github.com/DanielMSchmidt/cfast/issues/172 for details.`,
  );
}

/**
 * Resets the internal warn-once cache. Intended for tests only so
 * individual cases can observe the warning without leaking state
 * between them.
 *
 * @internal
 */
export function __resetImpersonationWarningCacheForTests(): void {
  warnedTables.clear();
}

/**
 * Creates an impersonation manager backed by a Cloudflare D1 database.
 *
 * Manages an audit trail of impersonation sessions, allowing admins to
 * temporarily act as another user for debugging and support. Each session
 * is logged with start and end timestamps.
 *
 * ## Graceful fallback when the table is missing
 *
 * If the `impersonation_logs` table does not exist yet (e.g. the consumer
 * upgraded `@cfast/auth` from 0.2.x to 0.3.x without running the new
 * migration), `getActiveImpersonation()` returns `null` instead of
 * throwing. This keeps authenticated requests working — they simply
 * behave as if no admin is impersonating anyone — and logs a one-time
 * warning pointing the operator at the migration they need to run. See
 * cfast issue #172.
 *
 * `impersonate()` and `stopImpersonating()` still propagate the underlying
 * error because silently swallowing a write would pretend an admin is
 * impersonating someone when the audit row was never recorded.
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
      try {
        const result = await d1
          .prepare(
            `SELECT ${targetCol} as target_user_id FROM ${table} WHERE ${adminCol} = ? AND ended_at IS NULL LIMIT 1`,
          )
          .bind(adminUserId)
          .first<{ target_user_id: string }>();

        return result ? { targetUserId: result.target_user_id } : null;
      } catch (error) {
        // Consumer upgraded @cfast/auth without applying the new
        // impersonation_logs migration. Return null so `createContext`
        // can continue serving authenticated requests — impersonation
        // is an admin-only feature and "no admin is impersonating
        // anyone" is the correct safe default. Warn once so the
        // operator notices and fixes their migrations.
        if (isMissingTableError(error, table)) {
          warnMissingImpersonationTable(table);
          return null;
        }
        throw error;
      }
    },
  };
}
