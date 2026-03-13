import { createDb } from "@cfast/db";
import type { Db } from "@cfast/db";
import type { AuthContext } from "~/auth.helpers.server";
import * as schema from "./schema";

export function createCfDb(d1: D1Database, ctx: AuthContext): Db {
  return createDb({
    d1,
    schema: schema as unknown as Record<string, any>,
    grants: ctx.grants,
    user: ctx.user ? { id: ctx.user.id } : null,
    cache: false,
  });
}
