export { definePermissions } from "./define-permissions";
export { grant } from "./grant";
export { checkPermissions } from "./check";
export { ForbiddenError } from "./errors";
export { CRUD_ACTIONS } from "./types";
export type {
  PermissionAction,
  CrudAction,
  Grant,
  WhereClause,
  PermissionDescriptor,
  PermissionCheckResult,
  Permissions,
  PermissionsConfig,
} from "./types";
