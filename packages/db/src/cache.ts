import type { CacheConfig, QueryCacheOptions } from "./types";

function parseTtl(ttl: string): number {
  const match = ttl.match(/^(\d+)(s|m|h)$/);
  if (!match) return 60;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    default:
      return 60;
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return (hash >>> 0).toString(36);
}

export type CacheManager = {
  generateKey: (sql: string, role: string, tableVersion: number) => string;
  getTableVersion: (table: string) => number;
  invalidateTable: (table: string) => void;
  invalidateTags: (tags: string[]) => Promise<void>;
  isExcluded: (table: string) => boolean;
  getTtlSeconds: (override?: string) => number;
  get: (key: string, tableName: string) => Promise<unknown | undefined>;
  set: (
    key: string,
    value: unknown,
    tableName: string,
    options?: QueryCacheOptions,
  ) => Promise<void>;
};

export function createCacheManager(config: CacheConfig): CacheManager {
  const tableVersions = new Map<string, number>();
  const tagToKeys = new Map<string, Set<string>>();
  const defaultTtl = config.ttl ?? "60s";
  const excludedTables = new Set(config.exclude ?? []);

  return {
    generateKey(sql: string, role: string, tableVersion: number): string {
      return `cfast:${role}:v${tableVersion}:${simpleHash(sql)}`;
    },

    getTableVersion(table: string): number {
      return tableVersions.get(table) ?? 0;
    },

    invalidateTable(table: string): void {
      const current = tableVersions.get(table) ?? 0;
      tableVersions.set(table, current + 1);
      config.onInvalidate?.([table]);
    },

    async invalidateTags(tags: string[]): Promise<void> {
      if (config.backend === "kv" && config.kv) {
        for (const tag of tags) {
          const keys = tagToKeys.get(tag);
          if (keys) {
            for (const key of keys) {
              await config.kv.delete(key);
            }
            tagToKeys.delete(tag);
          }
        }
      }
      // For cache-api backend, tags work via table version bumps
      // (the key changes when version changes)
    },

    isExcluded(table: string): boolean {
      return excludedTables.has(table);
    },

    getTtlSeconds(override?: string): number {
      return parseTtl(override ?? defaultTtl);
    },

    async get(
      key: string,
      tableName: string,
    ): Promise<unknown | undefined> {
      if (config.backend === "cache-api") {
        const cache = await caches.open("cfast-db");
        const response = await cache.match(
          new Request(`https://cfast-cache/${key}`),
        );
        if (response) {
          config.onHit?.(key, tableName);
          return response.json();
        }
        config.onMiss?.(key, tableName);
        return undefined;
      }

      if (config.backend === "kv" && config.kv) {
        const value = await config.kv.get(key, "json");
        if (value !== null) {
          config.onHit?.(key, tableName);
          return value;
        }
        config.onMiss?.(key, tableName);
        return undefined;
      }

      return undefined;
    },

    async set(
      key: string,
      value: unknown,
      _tableName: string,
      options?: QueryCacheOptions,
    ): Promise<void> {
      if (options === false) return;
      const ttl = this.getTtlSeconds(
        typeof options === "object" ? options?.ttl : undefined,
      );

      if (config.backend === "cache-api") {
        const cache = await caches.open("cfast-db");
        let cacheControl = `max-age=${ttl}`;

        if (typeof options === "object" && options?.staleWhileRevalidate) {
          const swr = parseTtl(options.staleWhileRevalidate);
          cacheControl = `max-age=${ttl}, stale-while-revalidate=${swr}`;
        }

        await cache.put(
          new Request(`https://cfast-cache/${key}`),
          new Response(JSON.stringify(value), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": cacheControl,
            },
          }),
        );
      }

      if (config.backend === "kv" && config.kv) {
        await config.kv.put(key, JSON.stringify(value), {
          expirationTtl: ttl,
        });
      }

      // Track tags for invalidation (works for both backends)
      if (typeof options === "object" && options?.tags) {
        for (const tag of options.tags) {
          if (!tagToKeys.has(tag)) tagToKeys.set(tag, new Set());
          tagToKeys.get(tag)!.add(key);
        }
      }
    },
  };
}
