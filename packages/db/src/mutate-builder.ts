import { drizzle } from "drizzle-orm/d1";
import type { SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Grant, PermissionDescriptor, DrizzleTable } from "@cfast/permissions";
import { checkOperationPermissions } from "./permissions";
import { buildPermissionFilter, combineWhere, makePermissions, getTableName } from "./utils";
import type { User } from "./utils";
import type { Operation } from "./types";

type MutateBuilderConfig = {
  d1: D1Database;
  schema: Record<string, unknown>;
  grants: Grant[];
  user: User | null;
  table: DrizzleTable;
  unsafe: boolean;
  onMutate?: (tableName: string) => void;
};

function checkIfNeeded(config: MutateBuilderConfig, grants: Grant[], permissions: PermissionDescriptor[]): void {
  if (!config.unsafe) {
    checkOperationPermissions(grants, permissions);
  }
}

function buildMutationWithReturning(
  config: MutateBuilderConfig,
  permissions: PermissionDescriptor[],
  tableName: string,
  execute: (returning: boolean) => Promise<unknown>,
): Operation<void> & { returning: () => Operation<unknown> } {
  return {
    permissions,
    async run(_params?: Record<string, unknown>): Promise<void> {
      checkIfNeeded(config, config.grants, permissions);
      await execute(false);
      config.onMutate?.(tableName);
    },
    returning() {
      return {
        permissions,
        async run(_params?: Record<string, unknown>): Promise<unknown> {
          checkIfNeeded(config, config.grants, permissions);
          const result = await execute(true);
          config.onMutate?.(tableName);
          return result;
        },
      };
    },
  };
}

/**
 * Creates an insert builder that produces permission-aware insert operations for a table.
 *
 * Insert permissions are checked at the role level only (no row-level WHERE injection).
 * After a successful insert, the table's cache version is bumped via `onMutate`.
 *
 * @param config - Configuration including D1, schema, grants, user, target table, unsafe flag, and mutation callback.
 * @returns An insert builder with a `values()` method.
 */
export function createInsertBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
  const permissions = makePermissions(config.unsafe, "create", config.table);
  const tableName = getTableName(config.table);

  return {
    values(values: Record<string, unknown>) {
      return buildMutationWithReturning(config, permissions, tableName, async (returning) => {
        const query = db.insert(config.table as SQLiteTable).values(values);
        if (returning) {
          return query.returning().get();
        }
        await query.run();
      });
    },
  };
}

/**
 * Creates an update builder that produces permission-aware update operations for a table.
 *
 * Row-level permission WHERE clauses are AND'd with the user-supplied WHERE condition.
 * After a successful update, the table's cache version is bumped via `onMutate`.
 *
 * @param config - Configuration including D1, schema, grants, user, target table, unsafe flag, and mutation callback.
 * @returns An update builder with a `set()` method that chains to `where()`.
 */
export function createUpdateBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
  const permissions = makePermissions(config.unsafe, "update", config.table);
  const tableName = getTableName(config.table);

  return {
    set(values: Record<string, unknown>) {
      return {
        where(condition: unknown) {
          const permFilter = buildPermissionFilter(
            config.grants, "update", config.table, config.user, config.unsafe,
          );
          const combinedWhere = combineWhere(condition as SQL | undefined, permFilter);

          return buildMutationWithReturning(config, permissions, tableName, async (returning) => {
            const query = db.update(config.table as SQLiteTable).set(values);
            if (combinedWhere) query.where(combinedWhere);
            if (returning) {
              return query.returning().get();
            }
            await query.run();
          });
        },
      };
    },
  };
}

/**
 * Creates a delete builder that produces permission-aware delete operations for a table.
 *
 * Row-level permission WHERE clauses are AND'd with the user-supplied WHERE condition.
 * After a successful delete, the table's cache version is bumped via `onMutate`.
 *
 * @param config - Configuration including D1, schema, grants, user, target table, unsafe flag, and mutation callback.
 * @returns A delete builder with a `where()` method.
 */
export function createDeleteBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema });
  const permissions = makePermissions(config.unsafe, "delete", config.table);
  const tableName = getTableName(config.table);

  return {
    where(condition: unknown) {
      const permFilter = buildPermissionFilter(
        config.grants, "delete", config.table, config.user, config.unsafe,
      );
      const combinedWhere = combineWhere(condition as SQL | undefined, permFilter);

      return buildMutationWithReturning(config, permissions, tableName, async (returning) => {
        const query = db.delete(config.table as SQLiteTable);
        if (combinedWhere) query.where(combinedWhere);
        if (returning) {
          return query.returning().get();
        }
        await query.run();
      });
    },
  };
}
