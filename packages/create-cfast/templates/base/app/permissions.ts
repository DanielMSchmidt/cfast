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
