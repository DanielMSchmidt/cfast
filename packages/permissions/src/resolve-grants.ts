import { or, type SQLWrapper } from "drizzle-orm";
import type { DrizzleSQL, Grant, Permissions } from "./types";

/**
 * Wraps a `DrizzleSQL` value for use with Drizzle's `or()`.
 *
 * At runtime, `DrizzleSQL` values from `where` callbacks are real Drizzle SQL
 * objects that satisfy `SQLWrapper`. Our `DrizzleSQL` type uses
 * `{ getSQL(): unknown }` intentionally to keep the permissions package loosely
 * coupled from Drizzle internals. This adapter bridges the two at the
 * drizzle-orm boundary.
 *
 * @param value - A `DrizzleSQL` value or `undefined`.
 * @returns The same value typed as `SQLWrapper`, or `undefined`.
 */
function toSQLWrapper(value: DrizzleSQL | undefined): SQLWrapper | undefined {
  // DrizzleSQL values are always real Drizzle SQL objects at runtime (SQLWrapper).
  // This is the drizzle-orm type boundary — analogous to the Workers env boundary.
  return value as SQLWrapper | undefined;
}

/**
 * Minimal user shape accepted by {@link resolveGrants}: any object with a
 * `roles` array. The function reads `.roles` and forwards them to the
 * underlying merge logic.
 */
export type UserWithRoles = { roles: readonly string[] };

function isUserWithRoles(value: unknown): value is UserWithRoles {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Array.isArray((value as { roles?: unknown }).roles)
  );
}

/**
 * Resolves and merges grants for multiple roles into a single flat array.
 *
 * Looks up each role's pre-expanded grants (from hierarchy resolution) and
 * deduplicates them by action + subject. When multiple grants share the same
 * action + subject:
 * - If **any** grant has no `where` clause, the merged grant is unrestricted.
 * - If **all** grants have `where` clauses, they are OR-merged via Drizzle's `or()`.
 *
 * This is used when a user has multiple roles and their grants need to be combined.
 *
 * Two calling styles are supported (both equivalent):
 * - **User object (preferred):** `resolveGrants(permissions, user)` where
 *   `user` has a `roles` field. The function extracts roles internally.
 * - **Roles array (legacy):** `resolveGrants(permissions, roles)` where
 *   `roles` is a string array. Still supported for backwards compatibility.
 *
 * @param permissions - The permissions object from {@link definePermissions}.
 * @param userOrRoles - Either a user object with a `roles` field, or an
 *   array of role names whose grants should be merged.
 * @returns A deduplicated array of {@link Grant} objects with merged `where` clauses.
 *
 * @example
 * ```ts
 * // Preferred: pass the user directly
 * const grants = resolveGrants(permissions, user);
 *
 * // Legacy: pass roles array (still works)
 * const grants = resolveGrants(permissions, user.roles);
 * ```
 */
export function resolveGrants(
  permissions: Permissions,
  user: UserWithRoles,
): Grant[];
export function resolveGrants(
  permissions: Permissions,
  roles: readonly string[],
): Grant[];
export function resolveGrants(
  permissions: Permissions,
  userOrRoles: UserWithRoles | readonly string[],
): Grant[] {
  const roles: readonly string[] = isUserWithRoles(userOrRoles)
    ? userOrRoles.roles
    : userOrRoles;

  // Collect all grants from all roles
  const allGrants: Grant[] = [];
  for (const role of roles) {
    const roleGrants = permissions.resolvedGrants[role];
    if (roleGrants) {
      allGrants.push(...roleGrants);
    }
  }

  if (allGrants.length === 0) return [];

  // Group by action + subject identity.
  // - For "all" grants, group by the literal "all" key.
  // - For string subjects, group by the string itself.
  // - For DrizzleTable object subjects, group by reference identity (so two
  //   distinct table objects with the same name remain separate, preserving
  //   the original behavior). String subjects with the same name as an object
  //   subject are NOT merged with the object — they live under their own key.
  type GroupKey = string;
  const groups = new Map<
    GroupKey,
    {
      action: Grant["action"];
      subject: Grant["subject"];
      wheres: Array<Grant["where"]>;
    }
  >();

  // Reference-identity ids for object subjects.
  const subjectIds = new Map<object, number>();
  let nextId = 0;

  function getSubjectKey(subject: Grant["subject"]): string {
    if (subject === "all") return "all";
    if (typeof subject === "string") return `s:${subject}`;
    let id = subjectIds.get(subject);
    if (id === undefined) {
      id = nextId++;
      subjectIds.set(subject, id);
    }
    return `o:${id}`;
  }

  for (const g of allGrants) {
    const key = `${g.action}:${getSubjectKey(g.subject)}`;
    let group = groups.get(key);
    if (!group) {
      group = { action: g.action, subject: g.subject, wheres: [] };
      groups.set(key, group);
    }
    group.wheres.push(g.where);
  }

  // Build merged grants
  const result: Grant[] = [];
  for (const group of groups.values()) {
    const hasUnrestricted = group.wheres.some((w) => w === undefined);

    if (hasUnrestricted) {
      result.push({ action: group.action, subject: group.subject });
    } else {
      const whereFns = group.wheres.filter(
        (w): w is NonNullable<Grant["where"]> => w !== undefined,
      );

      if (whereFns.length === 1) {
        result.push({
          action: group.action,
          subject: group.subject,
          where: whereFns[0],
        });
      } else {
        // OR-merge all where clauses
        const merged: Grant["where"] = (columns, user) =>
          or(
            ...whereFns.map((fn) => toSQLWrapper(fn(columns, user))),
          );

        result.push({
          action: group.action,
          subject: group.subject,
          where: merged,
        });
      }
    }
  }

  return result;
}
