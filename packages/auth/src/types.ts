import type { Grant, Permissions } from "@cfast/permissions";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  isImpersonating?: boolean;
  realUser?: { id: string; name: string };
};

export type AuthContext = {
  user: AuthUser | null;
  grants: Grant[];
};

export type AuthenticatedContext = {
  user: AuthUser;
  grants: Grant[];
};

export type AuthConfig = {
  permissions: Permissions;
  passkeys?: { rpName: string; rpId: string };
  session?: { expiresIn?: string };
  redirects?: { afterLogin?: string; loginPath?: string };
  anonymousRoles?: string[];
  defaultRoles?: string[];
};

export type AuthEnvConfig = {
  d1: D1Database;
  appUrl: string;
};

export type AuthInstance = {
  createContext: (request: Request) => Promise<AuthContext>;
  requireUser: (request: Request) => Promise<AuthenticatedContext>;
  getRoles: (userId: string) => Promise<string[]>;
  setRole: (userId: string, role: string) => Promise<void>;
  setRoles: (userId: string, roles: string[]) => Promise<void>;
  removeRole: (userId: string, role: string) => Promise<void>;
  /** Better Auth API handler — wired in Task 4 */
  api: null;
};
