/** @module permissions */
export { definePermissions } from "./define-permissions";
export { grant } from "./grant";
export { checkPermissions } from "./check";
export { resolveGrants } from "./resolve-grants";
export { ForbiddenError } from "./errors";
export { CRUD_ACTIONS, getTableName } from "./types";
export type {
  PermissionAction,
  CrudAction,
  DrizzleTable,
  Grant,
  GrantFn,
  WhereClause,
  PermissionDescriptor,
  PermissionCheckResult,
  Permissions,
  PermissionsConfig,
} from "./types";
