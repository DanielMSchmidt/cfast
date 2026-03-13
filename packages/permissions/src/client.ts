/**
 * Client-safe re-exports from `@cfast/permissions`.
 *
 * Import from `@cfast/permissions/client` in client bundles to avoid pulling in
 * server-only code (`definePermissions`, `grant`, `checkPermissions`).
 * Only types and the `ForbiddenError` class are exported here.
 *
 * @module
 */
export { ForbiddenError } from "./errors";
export type {
  PermissionAction,
  CrudAction,
  PermissionDescriptor,
  PermissionCheckResult,
} from "./types";
