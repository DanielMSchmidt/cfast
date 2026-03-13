import { definePermissions } from "@cfast/permissions";

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
  grants: (grant) => ({
    member: [],
    admin: [grant("manage", "all")],
  }),
});

export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (user.roles.includes("admin")) return true;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser, checkRoles: UserRole[]): boolean {
  return checkRoles.some((role) => hasRole(user, role));
}
