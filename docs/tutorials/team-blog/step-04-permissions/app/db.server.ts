import { createDb } from "@cfast/db";
import type { Grant, DrizzleTable } from "@cfast/permissions";
import * as schema from "./schema";
import { env } from "./env.server";

export function getCfDb(grants: Grant[], user: { id: string } | null) {
  const { DB } = env.get();
  return createDb({
    d1: DB,
    schema: schema as Record<string, DrizzleTable>,
    grants,
    user,
    cache: false,
  });
}
