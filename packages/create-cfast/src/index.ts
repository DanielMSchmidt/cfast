#!/usr/bin/env node
import { green, cyan, bold, yellow } from "kolorist";
import { parseArgs, printHelp } from "./args";
import { promptForConfig } from "./prompts";
import type { Config } from "./types";
import { scaffold } from "./scaffold";

function printNextSteps(config: Config): void {
  console.log();
  console.log(green(`✔ Scaffolded ${bold(config.projectName)}/`));
  console.log();
  console.log("  Next steps:");
  console.log(cyan(`    cd ${config.projectName}`));
  console.log(cyan(`    pnpm install`));
  console.log(cyan(`    pnpm dev`));

  if (config.features.db) {
    console.log();
    console.log("  Database (D1 + Drizzle):");
    console.log(cyan(`    pnpm db:generate`));
    console.log(cyan(`    pnpm db:migrate:local`));
  }

  if (config.features.email) {
    console.log();
    console.log("  Email:");
    console.log(`    ${yellow("Edit .dev.vars to set your MAILGUN_API_KEY")}`);
  }

  console.log();
  console.log("  Deploy:");
  console.log(cyan(`    pnpm deploy:staging`));
  console.log(cyan(`    pnpm deploy:production`));
  console.log();
}

async function main(): Promise<void> {
  console.log();
  console.log(bold("  Welcome to cfast!"));
  console.log();

  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const config = await promptForConfig(args);
  if (!config) {
    console.log("Cancelled.");
    return;
  }

  scaffold(config);
  printNextSteps(config);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
