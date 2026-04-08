import type { Grant, Permissions } from "@cfast/permissions";

/**
 * Extracts the role string-literal union from a {@link Permissions} object.
 *
 * `definePermissions({ roles: ["admin", "user"] as const, ... })` produces a
 * `Permissions<readonly ["admin", "user"]>`. Feeding that into this helper
 * yields the union `"admin" | "user"`, which is what we use to type
 * `AuthConfig.defaultRoles` / `AuthConfig.anonymousRoles` so passing an
 * unknown role becomes a TS error instead of a runtime surprise.
 *
 * When the caller passes a loosely-typed `Permissions<readonly string[]>`
 * (e.g. imported from a dynamic module), this resolves to `string` and the
 * existing lenient behavior is preserved.
 */
export type RoleNameOf<P> = P extends Permissions<infer R>
  ? R extends readonly (infer X)[]
    ? X extends string
      ? X
      : string
    : string
  : string;

/**
 * The authenticated user object available throughout the application.
 *
 * Contains identity fields, assigned roles, and optional impersonation state.
 * This is the user shape returned by {@link AuthContext} and {@link AuthenticatedContext},
 * and is the same object passed to `createDb({ user })` for permission resolution.
 */
export type AuthUser = {
  /** Unique user identifier (UUID from Better Auth). */
  id: string;
  /** The user's email address, used for magic link authentication. */
  email: string;
  /** Display name for the user. */
  name: string;
  /** URL to the user's avatar image, or `null` if not set. */
  avatarUrl: string | null;
  /** Roles assigned to this user, matching role names from `@cfast/permissions`. */
  roles: string[];
  /** Whether an admin is currently impersonating this user. */
  isImpersonating?: boolean;
  /** The real admin user performing the impersonation, if active. */
  realUser?: { id: string; name: string };
};

/**
 * The auth context for a request, which may or may not be authenticated.
 *
 * When the user is not logged in, `user` is `null` and `grants` contains
 * only the anonymous role grants. Use {@link AuthenticatedContext} when
 * you need a guaranteed non-null user.
 */
export type AuthContext = {
  /** The current user, or `null` if the request is unauthenticated. */
  user: AuthUser | null;
  /** Permission grants resolved from the user's roles (or anonymous roles). */
  grants: Grant[];
};

/**
 * A narrowed {@link AuthContext} where the user is guaranteed to be present.
 *
 * Returned by `auth.requireUser()`, which redirects to the login page if
 * the request is unauthenticated. Use this in loaders and actions that
 * require a logged-in user.
 */
export type AuthenticatedContext = {
  /** The authenticated user (always present). */
  user: AuthUser;
  /** Permission grants resolved from the user's assigned roles. */
  grants: Grant[];
};

/**
 * Configuration for {@link createAuth}.
 *
 * Defines authentication methods, session behavior, role management rules,
 * and integration with `@cfast/permissions`.
 *
 * The generic parameter `P` captures the concrete {@link Permissions} object
 * passed to `createAuth`, which lets TypeScript narrow `anonymousRoles` and
 * `defaultRoles` to the exact role union declared in the permissions config
 * (e.g. `"admin" | "editor" | "reader"`). Passing an unknown role is then a
 * compile-time error instead of a silent runtime surprise. Callers that
 * supply a loosely-typed `Permissions<readonly string[]>` fall back to the
 * historical `string[]` shape, so this is a non-breaking refinement.
 */
export type AuthConfig<
  P extends Permissions<readonly string[]> = Permissions<readonly string[]>,
> = {
  /** The permissions config from `definePermissions()`. Roles are inferred from this. */
  permissions: P;
  /** Optional Drizzle schema override for the Better Auth database adapter. */
  schema?: Record<string, unknown>;
  /** WebAuthn passkey configuration. Required to enable passkey authentication. */
  passkeys?: {
    /** Relying party display name shown during WebAuthn registration. */
    rpName: string;
    /**
     * Relying party identifier, typically the app's domain (e.g., `"myapp.com"`).
     *
     * Accepts either a static string or a function that resolves the RP ID
     * from the incoming request. Use the function form for multi-tenant
     * deployments that serve multiple domains from a single worker — the
     * request-aware variant lets you return the actual hostname the user
     * is connecting from instead of hard-coding a single value at factory
     * time. The function form requires calling `initAuth(env, request)`
     * so the request is available when Better Auth is constructed.
     *
     * @example Static value
     * ```ts
     * passkeys: { rpName: "My App", rpId: "myapp.com" }
     * ```
     *
     * @example Per-request resolver
     * ```ts
     * passkeys: {
     *   rpName: "My App",
     *   rpId: (request) => new URL(request.url).hostname,
     * }
     * ```
     */
    rpId: string | ((request: Request) => string);
  };
  /** Magic link email configuration. Required to enable magic link authentication. */
  magicLink?: {
    /** Callback to send the magic link email. Receives the user's email and the login URL. */
    sendMagicLink: (params: { email: string; url: string }) => Promise<void>;
  };
  /** Session lifetime configuration. */
  session?: {
    /** How long sessions last before expiring (e.g., `"30d"`, `"12h"`, `"60m"`). Defaults to `"30d"`. */
    expiresIn?: string;
  };
  /** Redirect paths for the authentication flow. */
  redirects?: {
    /** Where to redirect after successful login. Defaults to `"/"`. */
    afterLogin?: string;
    /** Where to send unauthenticated users. Defaults to `"/login"`. */
    loginPath?: string;
  };
  /**
   * Roles assigned to unauthenticated (anonymous) requests for permission resolution.
   *
   * Constrained to the role union from {@link AuthConfig.permissions} — passing
   * a role that was not declared in `definePermissions()` is a TS error.
   */
  anonymousRoles?: RoleNameOf<P>[];
  /**
   * Default roles assigned to authenticated users who have no explicit role assignments.
   * Defaults to `["reader"]`.
   *
   * Constrained to the role union from {@link AuthConfig.permissions} — passing
   * a role that was not declared in `definePermissions()` is a TS error.
   */
  defaultRoles?: RoleNameOf<P>[];
  /** Custom table name for storing role assignments. Defaults to `"roles"`. */
  roleTableName?: string;
  /** Maps each role to the set of roles it is allowed to assign. Controls who can promote whom. */
  roleGrants?: Record<string, string[]>;
  /** Impersonation feature configuration. */
  impersonation?: {
    /** Roles permitted to impersonate other users. Defaults to `["admin"]`. */
    allowedRoles?: string[];
  };
  /** Custom email template functions. */
  templates?: {
    /** Returns an HTML string for the magic link email. Receives the login URL and recipient email. */
    magicLink?: (props: { url: string; email: string }) => string;
  };
};

/**
 * Per-request environment bindings required to initialize an {@link AuthInstance}.
 *
 * Passed to the `initAuth()` function returned by {@link createAuth}.
 */
export type AuthEnvConfig = {
  /** The Cloudflare D1 database binding for session and user storage. */
  d1: D1Database;
  /** The application's public URL, used as the base URL for Better Auth endpoints. */
  appUrl: string;
};

/**
 * Grouped role-management API exposed on {@link AuthInstance.roles}.
 *
 * Every method on this namespace reuses the same underlying D1 role manager
 * and role-grant rules as the single-request `AuthInstance` it belongs to.
 * Prefer this grouped form over the top-level `getRoles` / `setRole` /
 * `setRoles` / `removeRole` aliases — those stay for backwards compatibility
 * but the grouped namespace scales better when new role operations are
 * added (e.g. `list`, `has`, `audit`), and it reads more like a real API
 * on top of an already-initialized auth instance.
 *
 * Obtain one by calling `auth.roles`, where `auth` is the value returned
 * from `initAuth(env)` — no separate factory, no second role-manager
 * instantiation.
 *
 * @example
 * ```ts
 * const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });
 * const roles = await auth.roles.get(userId);
 * await auth.roles.set(userId, "editor", { callerRoles: ["admin"] });
 * await auth.roles.remove(userId, "editor");
 * ```
 */
export type AuthRolesApi = {
  /** Retrieves all roles assigned to a user. */
  get: (userId: string) => Promise<string[]>;
  /**
   * Assigns a single role to a user (additive, does not remove existing roles).
   * When `caller.callerRoles` is provided, validates against `roleGrants` rules.
   */
  set: (
    userId: string,
    role: string,
    caller?: { callerRoles?: string[] },
  ) => Promise<void>;
  /**
   * Replaces all of a user's roles with the given set.
   * When `caller.callerRoles` is provided, validates each role against `roleGrants` rules.
   */
  setAll: (
    userId: string,
    roles: string[],
    caller?: { callerRoles?: string[] },
  ) => Promise<void>;
  /** Removes a single role from a user. */
  remove: (userId: string, role: string) => Promise<void>;
};

/**
 * The initialized auth instance with methods for session management, role assignment,
 * impersonation, and request handling.
 *
 * Created by calling the `initAuth()` function returned from {@link createAuth}
 * with an {@link AuthEnvConfig}.
 */
export type AuthInstance = {
  /**
   * Builds an {@link AuthContext} from the request's session cookie.
   * Returns a context with `user: null` if the session is invalid or missing.
   */
  createContext: (request: Request) => Promise<AuthContext>;
  /**
   * Like {@link AuthInstance.createContext | createContext}, but redirects to the login page
   * if the user is not authenticated. Sets a `cfast_redirect_to` cookie so the user
   * returns to the original URL after login.
   *
   * @throws {Response} A 302 redirect response when the user is not authenticated.
   */
  requireUser: (request: Request) => Promise<AuthenticatedContext>;
  /**
   * Grouped role-management API. Prefer `auth.roles.get/set/setAll/remove`
   * over the legacy top-level aliases when writing new code — see
   * {@link AuthRolesApi}.
   */
  roles: AuthRolesApi;
  /**
   * Retrieves all roles assigned to a user.
   * @deprecated Use {@link AuthInstance.roles}`.get()` instead.
   */
  getRoles: (userId: string) => Promise<string[]>;
  /**
   * Assigns a single role to a user (additive, does not remove existing roles).
   * When `caller.callerRoles` is provided, validates against `roleGrants` rules.
   * @deprecated Use {@link AuthInstance.roles}`.set()` instead.
   */
  setRole: (
    userId: string,
    role: string,
    caller?: { callerRoles?: string[] },
  ) => Promise<void>;
  /**
   * Replaces all of a user's roles with the given set.
   * When `caller.callerRoles` is provided, validates each role against `roleGrants` rules.
   * @deprecated Use {@link AuthInstance.roles}`.setAll()` instead.
   */
  setRoles: (
    userId: string,
    roles: string[],
    caller?: { callerRoles?: string[] },
  ) => Promise<void>;
  /**
   * Removes a single role from a user.
   * @deprecated Use {@link AuthInstance.roles}`.remove()` instead.
   */
  removeRole: (userId: string, role: string) => Promise<void>;
  /**
   * Starts an impersonation session where the admin acts as the target user.
   * Only users with roles listed in `impersonation.allowedRoles` can impersonate.
   *
   * @throws {Error} If the admin user's roles do not permit impersonation.
   */
  impersonate: (adminUserId: string, targetUserId: string) => Promise<void>;
  /** Ends all active impersonation sessions for the given admin user. */
  stopImpersonating: (adminUserId: string) => Promise<void>;
  /**
   * Sends a magic link email to the given address for passwordless authentication.
   *
   * @throws {Error} If the magic link plugin is not configured.
   */
  sendMagicLink: (params: {
    /** The recipient's email address. */
    email: string;
    /** Override the post-login redirect URL. Defaults to `redirects.afterLogin`. */
    callbackURL?: string;
  }) => Promise<void>;
  /** Forwards an HTTP request to the Better Auth handler for processing auth API routes. */
  handler: (request: Request) => Promise<Response>;
  /** The underlying Better Auth instance, for escape-hatch usage. */
  api: unknown;
};
