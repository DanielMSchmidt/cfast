import type { Config } from "../types";

/**
 * Generates the scaffolded `scripts/seed.ts` file.
 *
 * Before #190 this file was hand-rolled in every demo app and each one used
 * a different pattern — some called `db.mutate("tablename")` (a method that
 * never existed on `@cfast/db`), others reached into raw Drizzle and broke
 * when the schema grew. The new canonical pattern is `defineSeed({...})`
 * from `@cfast/db`: one config object, one `.run(db)` executor, type-safe
 * row shapes inferred from the Drizzle schema.
 *
 * The generated file is run via `pnpm db:seed:local`, which Wrangler
 * executes as a local Worker so `env.DB` points at the local D1 instance
 * — the same one `pnpm dev` uses.
 */
export function generateSeedScript(_config: Config): string {
  return `/**
 * Local-dev seed script.
 *
 * Run with:
 *
 *   pnpm db:seed:local
 *
 * This is a plain \`tsx\` script that connects to your local D1 database
 * via Wrangler's local runtime and inserts a small fixture dataset. The
 * canonical pattern is \`defineSeed({...})\` from \`@cfast/db\`:
 *
 *  - Row types are inferred from your Drizzle schema, so typos in column
 *    names fail at \`tsc\` time instead of at insert time.
 *  - Entries are inserted in the order you declare them, so put parent
 *    tables (users, orgs) before child tables (posts) that reference them.
 *  - \`seed.run(db)\` hops through \`db.unsafe()\` internally so the seed
 *    does not need its own grants plumbing.
 *  - Empty \`rows\` arrays are skipped, so you can leave placeholder
 *    entries while you build out the schema without breaking the seed.
 *
 * Extend the \`entries\` array below as you add tables.
 */
import { getPlatformProxy } from "wrangler";
import { createDb, defineSeed } from "@cfast/db";
import * as schema from "~/db/schema";

type Env = { DB: D1Database };

async function main(): Promise<void> {
  const proxy = await getPlatformProxy<Env>();

  try {
    const db = createDb({
      d1: proxy.env.DB,
      schema,
      // Seeds run as a system task — there is no authenticated user, so
      // we pass \`[]\` for grants and \`null\` for user. \`defineSeed\`
      // still hops through \`.unsafe()\` internally so this is belt +
      // braces.
      grants: [],
      user: null,
      cache: false,
    });

    const seed = defineSeed({
      entries: [
        {
          table: schema.items,
          rows: [
            {
              id: "seed-item-1",
              title: "Welcome to your new cfast app",
              content: "This row was inserted by scripts/seed.ts. Edit that file to customise your seed data.",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "seed-item-2",
              title: "Add more seed rows here",
              content: "Each entry in the \`entries\` array becomes one INSERT per row, batched atomically per table.",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ],
    });

    await seed.run(db);
    console.log(
      \`Seed complete: inserted \${seed.entries.reduce((sum, e) => sum + e.rows.length, 0)} rows across \${seed.entries.length} table(s).\`,
    );
  } finally {
    await proxy.dispose();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
`;
}
