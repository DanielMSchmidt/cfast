import type { Config } from "../types";

export function generateDevVars(config: Config): string | null {
  const lines: string[] = [];

  if (config.features.email) {
    lines.push(`MAILGUN_API_KEY=test-key`);
  }

  if (lines.length === 0) return null;
  return lines.join("\n") + "\n";
}
