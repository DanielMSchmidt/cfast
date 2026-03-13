import { env } from "cloudflare:test";
import { createDb } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { permissions } from "./permissions";
import { schema } from "./schema";
import type { Grant } from "@cfast/permissions";
import type { CacheConfig } from "@cfast/db";

type TestUser = { id: string; role: string };

export function dbAs(
  user: TestUser,
  grants?: Grant[],
  cache?: CacheConfig | false,
) {
  return createDb({
    d1: env.DB,
    schema,
    grants: grants ?? resolveGrants(permissions, [user.role]),
    user: { id: user.id },
    cache: cache ?? false,
  });
}

export function makeGetContext(user: TestUser) {
  const grants = resolveGrants(permissions, [user.role]);
  return async (_args: { request: Request; params: Record<string, string | undefined> }) => ({
    db: dbAs(user, grants),
    user,
    grants,
  });
}
