import type { CliArgs } from "./types";

const BOOLEAN_FLAGS = ["auth", "db", "storage", "email", "ui", "admin", "all", "help"] as const;

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    projectName: undefined,
    auth: false,
    db: false,
    storage: false,
    email: false,
    ui: false,
    admin: false,
    all: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const flag = arg.slice(2) as (typeof BOOLEAN_FLAGS)[number];
      if (BOOLEAN_FLAGS.includes(flag)) {
        args[flag] = true;
      }
    } else if (!args.projectName) {
      args.projectName = arg;
    }
  }

  return args;
}

export function printHelp(): void {
  console.log(`
  Usage: create-cfast [project-name] [options]

  Options:
    --auth       Include @cfast/auth (magic email + passkeys)
    --db         Include @cfast/db (D1 + Drizzle ORM)
    --storage    Include @cfast/storage (R2 file uploads)
    --email      Include @cfast/email (email sending)
    --ui         Include @cfast/ui (components + actions)
    --admin      Include @cfast/admin (admin panel)
    --all        Include all packages
    --help       Show this help message
  `);
}
