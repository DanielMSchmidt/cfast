import { drizzle } from "drizzle-orm/d1";
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
    async run(_params: Record<string, unknown>): Promise<void> {
      checkIfNeeded(config, config.grants, permissions);
      await execute(false);
      config.onMutate?.(tableName);
    },
    returning() {
      return {
        permissions,
        async run(_params: Record<string, unknown>): Promise<unknown> {
          checkIfNeeded(config, config.grants, permissions);
          const result = await execute(true);
          config.onMutate?.(tableName);
          return result;
        },
      };
    },
  };
}

export function createInsertBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const permissions = makePermissions(config.unsafe, "create", config.table);
  const tableName = getTableName(config.table);

  return {
    values(values: Record<string, unknown>) {
      return buildMutationWithReturning(config, permissions, tableName, async (returning) => {
        const query = db.insert(config.table as any).values(values);
        if (returning) {
          return query.returning().get();
        }
        await query.run();
      });
    },
  };
}

export function createUpdateBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const permissions = makePermissions(config.unsafe, "update", config.table);
  const tableName = getTableName(config.table);

  return {
    set(values: Record<string, unknown>) {
      return {
        where(condition: unknown) {
          const permFilter = buildPermissionFilter(
            config.grants, "update", config.table, config.user, config.unsafe,
          );
          const combinedWhere = combineWhere(condition, permFilter);

          return buildMutationWithReturning(config, permissions, tableName, async (returning) => {
            const query = db.update(config.table as any).set(values).where(combinedWhere as any);
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

export function createDeleteBuilder(config: MutateBuilderConfig) {
  const db = drizzle(config.d1, { schema: config.schema as Record<string, any> });
  const permissions = makePermissions(config.unsafe, "delete", config.table);
  const tableName = getTableName(config.table);

  return {
    where(condition: unknown) {
      const permFilter = buildPermissionFilter(
        config.grants, "delete", config.table, config.user, config.unsafe,
      );
      const combinedWhere = combineWhere(condition, permFilter);

      return buildMutationWithReturning(config, permissions, tableName, async (returning) => {
        const query = db.delete(config.table as any).where(combinedWhere as any);
        if (returning) {
          return query.returning().get();
        }
        await query.run();
      });
    },
  };
}
