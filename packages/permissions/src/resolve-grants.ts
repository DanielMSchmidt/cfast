import { or, type SQLWrapper } from "drizzle-orm";
import type { Grant, Permissions } from "./types";

/**
 * Resolves grants for multiple roles by looking up each role's pre-expanded
 * grants and merging/deduplicating them.
 *
 * When multiple grants share the same action + subject:
 * - If ANY grant has no `where` clause, the merged grant is unrestricted (no where)
 * - If ALL grants have `where` clauses, they are OR-merged via drizzle's `or()`
 */
export function resolveGrants(
  permissions: Permissions,
  roles: string[],
): Grant[] {
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
  // Subject uses reference equality for DrizzleTable, string comparison for "all".
  type GroupKey = string;
  const groups = new Map<GroupKey, { action: Grant["action"]; subject: Grant["subject"]; wheres: Array<Grant["where"]> }>();

  // We need a way to create unique keys for action+subject pairs
  // where subject identity is by reference. Use a WeakMap for table references.
  const subjectIds = new Map<Grant["subject"], number>();
  let nextId = 0;

  function getSubjectId(subject: Grant["subject"]): number {
    let id = subjectIds.get(subject);
    if (id === undefined) {
      id = nextId++;
      subjectIds.set(subject, id);
    }
    return id;
  }

  for (const g of allGrants) {
    const key = `${g.action}:${getSubjectId(g.subject)}`;
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
            ...(whereFns.map((fn) => fn(columns, user)) as SQLWrapper[]),
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
