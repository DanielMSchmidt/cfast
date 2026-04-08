import type { Config } from "../types";

/**
 * Generates a `wrangler.toml` with a top-level (local dev) binding section
 * plus `[env.staging]` and `[env.production]` blocks for `pnpm deploy:staging` /
 * `pnpm deploy:production`.
 *
 * Every repeated binding (d1 databases, r2 buckets, kv namespaces) MUST use
 * TOML's array-of-tables syntax (`[[...]]`). Wrangler and `wrangler types`
 * crash on single-bracket `[env.production.kv_namespaces]` because a
 * single-bracket form declares one inline table, not an array entry — the
 * binding never registers and `typegen` emits `ERROR: ...` for every env.
 * Regression guard: see `#183`.
 */
export function generateWranglerToml(config: Config): string {
  const lines: string[] = [];

  lines.push(`name = "${config.projectName}"`);
  lines.push(`compatibility_date = "2025-12-01"`);
  lines.push(`compatibility_flags = ["nodejs_compat"]`);
  lines.push(`main = "./workers/app.ts"`);

  // [vars]
  const vars: [string, string][] = [
    ["APP_URL", "http://localhost:5173"],
  ];
  if (config.features.email) {
    vars.push(["MAILGUN_DOMAIN", "sandbox.mailgun.org"]);
  }
  lines.push("");
  lines.push("[vars]");
  for (const [key, value] of vars) {
    lines.push(`${key} = "${value}"`);
  }

  // Emit each repeated binding once for local dev + once per named env.
  const envPrefixes: ReadonlyArray<{ prefix: string; comment: string }> = [
    { prefix: "", comment: "Local dev binding (used by `wrangler dev` / `pnpm dev`)." },
    { prefix: "env.staging.", comment: "Staging deploy (`pnpm deploy:staging`). Replace `local` with the real resource ID after `wrangler d1 create` / `wrangler kv namespace create` / `wrangler r2 bucket create`." },
    { prefix: "env.production.", comment: "Production deploy (`pnpm deploy:production`). Replace `local` with the real resource ID after `wrangler d1 create` / `wrangler kv namespace create` / `wrangler r2 bucket create`." },
  ];

  for (const { prefix, comment } of envPrefixes) {
    if (prefix !== "") {
      lines.push("");
      lines.push(`# ${comment}`);
      lines.push(`[${prefix.slice(0, -1)}]`);
      lines.push(`[${prefix}vars]`);
      for (const [key, value] of vars) {
        lines.push(`${key} = "${value}"`);
      }
    }

    // [[d1_databases]] — MUST be array-of-tables, not `[env.*.d1_databases]`
    if (config.features.db) {
      lines.push("");
      lines.push(`[[${prefix}d1_databases]]`);
      lines.push(`binding = "DB"`);
      lines.push(`database_name = "${config.projectName}"`);
      lines.push(`database_id = "local"`);
      lines.push(`migrations_dir = "drizzle"`);
    }

    // [[r2_buckets]]
    if (config.features.storage) {
      lines.push("");
      lines.push(`[[${prefix}r2_buckets]]`);
      lines.push(`binding = "UPLOADS"`);
      lines.push(`bucket_name = "${config.projectName}-uploads"`);
    }

    // [[kv_namespaces]]
    if (config.features.auth) {
      lines.push("");
      lines.push(`[[${prefix}kv_namespaces]]`);
      lines.push(`binding = "CACHE"`);
      lines.push(`id = "local"`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
