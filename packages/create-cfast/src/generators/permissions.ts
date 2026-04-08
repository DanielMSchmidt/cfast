import type { Config } from "../types";

/**
 * Generates `app/permissions.ts`.
 *
 * Mirrors the static `templates/base/app/permissions.ts` shape (the
 * `member` / `admin` role hierarchy) but injects extra grants when the
 * scaffolder also ships its worked `composeActions` example at
 * `app/routes/items.tsx` (#153). That route needs the `member` role to
 * have `create` / `read` / `delete` grants on the `items` table so a
 * freshly-signed-up user can actually see the example doing something
 * instead of hitting `ForbiddenError` the moment they click a button.
 *
 * We use the string-subject form of `grant()` so the permissions file
 * stays free of schema imports and still compiles when `db` is
 * disabled. The condition below MUST stay in lockstep with
 * `shouldEmitItemsExample()` in `./items-example.ts` — adjusting one
 * without the other ships a route that 500s or a dead permissions
 * grant.
 */
export function generatePermissions(config: Config): string {
  const wantsItemsExample =
    config.features.db && config.features.ui && config.features.auth;

  const memberGrants = wantsItemsExample
    ? `    grant("read", "items"),
    grant("create", "items"),
    grant("delete", "items"),`
    : "";

  return `import { definePermissions, grant } from "@cfast/permissions";

export type UserRole = "admin" | "member";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
};

const appRoles = ["member", "admin"] as const;

export const permissions = definePermissions<AuthUser>()({
  roles: appRoles,
  hierarchy: {
    admin: ["member"],
  },
  grants: {
    member: [
${memberGrants}
    ],
    admin: [grant("manage", "all")],
  },
});

export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (user.roles.includes("admin")) return true;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser, checkRoles: UserRole[]): boolean {
  return checkRoles.some((role) => hasRole(user, role));
}
`;
}
