export type UserRole = "admin" | "editor" | "author" | "reader";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: UserRole[];
  isImpersonating?: boolean;
  impersonatedBy?: string;
  realUser?: { id: string; name: string };
};

export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (user.roles.includes("admin")) return true;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser, checkRoles: UserRole[]): boolean {
  return checkRoles.some((role) => hasRole(user, role));
}
