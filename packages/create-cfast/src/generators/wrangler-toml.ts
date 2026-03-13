import type { Config } from "../types";

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

  // [[d1_databases]]
  if (config.features.db) {
    lines.push("");
    lines.push("[[d1_databases]]");
    lines.push(`binding = "DB"`);
    lines.push(`database_name = "${config.projectName}"`);
    lines.push(`database_id = "local"`);
    lines.push(`migrations_dir = "drizzle"`);
  }

  // [[r2_buckets]]
  if (config.features.storage) {
    lines.push("");
    lines.push("[[r2_buckets]]");
    lines.push(`binding = "UPLOADS"`);
    lines.push(`bucket_name = "${config.projectName}-uploads"`);
  }

  // [[kv_namespaces]]
  if (config.features.auth) {
    lines.push("");
    lines.push("[[kv_namespaces]]");
    lines.push(`binding = "CACHE"`);
    lines.push(`id = "local"`);
  }

  lines.push("");
  return lines.join("\n");
}
