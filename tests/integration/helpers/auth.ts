import { resolveGrants } from "@cfast/permissions";
import type { Permissions, Grant } from "@cfast/permissions";

export type TestSession = {
  userId: string;
  role: string;
  grants: Grant[];
};

export function createTestSession(
  userId: string,
  role: string,
  perms: Permissions,
): TestSession {
  return {
    userId,
    role,
    grants: resolveGrants(perms, [role]),
  };
}
