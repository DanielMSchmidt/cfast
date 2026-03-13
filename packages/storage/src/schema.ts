import type { FiletypeConfig, StorageSchema, StorageInstance, ClientStorageConfig, HandleContext } from "./types.js";
import { handleUpload } from "./handle.js";
import { serveFile, getPublicUrl as getPublicUrlFn, createSignedUrl, verifySignedUrl as verifySignedUrlFn } from "./serve.js";

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
};

/**
 * Parse a human-readable size string into bytes.
 *
 * Supports `b`, `kb`, `mb`, and `gb` units (case-insensitive). Decimal values
 * are supported and the result is rounded to the nearest byte.
 *
 * @param size - Size string (e.g. `"10mb"`, `"1.5kb"`, `"500b"`, `"1gb"`).
 * @returns The size in bytes.
 * @throws If the format is invalid.
 *
 * @example
 * ```ts
 * import { parseSize } from "@cfast/storage";
 *
 * parseSize("2mb");   // 2097152
 * parseSize("1.5kb"); // 1536
 * parseSize("500b");  // 500
 * ```
 */
export function parseSize(size: string): number {
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid size format: "${size}". Expected format: "10mb", "1.5kb", etc.`);
  }
  const value = parseFloat(match[1]);
  const unit = match[2];
  return Math.round(value * SIZE_UNITS[unit]);
}

/**
 * Define a file type with its constraints and key generation strategy.
 *
 * Applies defaults for optional fields: `uploadable` defaults to `true`,
 * `replace` to `false`, `multipartThreshold` to `"5mb"`, and `partSize` to `"10mb"`.
 *
 * @typeParam TInput - The shape of caller-provided input available in the `key` function and hooks.
 * @param config - The file type configuration.
 * @returns The config with defaults applied, fully resolved.
 *
 * @example
 * ```ts
 * import { filetype } from "@cfast/storage";
 *
 * const avatars = filetype({
 *   bucket: "UPLOADS",
 *   accept: ["image/jpeg", "image/png", "image/webp"],
 *   maxSize: "2mb",
 *   key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
 *   replace: true,
 * });
 * ```
 */
export function filetype<TInput = Record<string, unknown>>(
  config: FiletypeConfig<TInput>,
): FiletypeConfig<TInput> & { uploadable: boolean; replace: boolean; multipartThreshold: string; partSize: string } {
  return {
    ...config,
    uploadable: config.uploadable ?? true,
    replace: config.replace ?? false,
    multipartThreshold: config.multipartThreshold ?? "5mb",
    partSize: config.partSize ?? "10mb",
  };
}

/**
 * Create a type-safe storage instance from a schema of named file types.
 *
 * The returned instance provides `handle` (upload), `serve`, `getPublicUrl`,
 * `getSignedUrl`, `verifySignedUrl`, and `clientConfig` methods that are all
 * scoped to the declared schema.
 *
 * @typeParam T - The storage schema type, inferred from the `schema` argument.
 * @param schema - A record mapping file type names to their {@link FiletypeConfig}.
 * @returns A {@link StorageInstance} with methods for uploads, serving, and URL generation.
 *
 * @example
 * ```ts
 * import { defineStorage, filetype } from "@cfast/storage";
 *
 * export const storage = defineStorage({
 *   avatars: filetype({
 *     bucket: "UPLOADS",
 *     accept: ["image/jpeg", "image/png", "image/webp"],
 *     maxSize: "2mb",
 *     key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
 *     replace: true,
 *   }),
 * });
 * ```
 */
export function defineStorage<T extends StorageSchema>(schema: T): StorageInstance<T> {
  return {
    schema,

    handle: async (name, request, ctx) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      if (config.uploadable === false) throw new Error(`Filetype "${String(name)}" is not uploadable`);
      return handleUpload(config, request, ctx as HandleContext<unknown>);
    },

    serve: async (name, key, options) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      const bucket = (options.env as Record<string, R2Bucket>)[config.bucket];
      if (!bucket) throw new Error(`R2 bucket binding "${config.bucket}" not found in env`);
      return serveFile(bucket, key, options.headers);
    },

    getPublicUrl: (name, key) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      if (!config.publicUrl) throw new Error(`Filetype "${String(name)}" has no publicUrl configured`);
      return getPublicUrlFn(config.publicUrl, key);
    },

    getSignedUrl: async (name, key, options) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      const secret = (options.env as Record<string, string>)["STORAGE_SECRET"];
      if (!secret) throw new Error("STORAGE_SECRET binding not found in env");
      return createSignedUrl(String(name), key, secret, options.expiresIn);
    },

    verifySignedUrl: async (url, options) => {
      const secret = (options.env as Record<string, string>)["STORAGE_SECRET"];
      if (!secret) throw new Error("STORAGE_SECRET binding not found in env");
      return verifySignedUrlFn(url, secret);
    },

    clientConfig: (): ClientStorageConfig => {
      const config: ClientStorageConfig = {};
      for (const [name, ft] of Object.entries(schema)) {
        if (ft.uploadable === false) continue;
        config[name] = {
          accept: ft.accept,
          maxSize: ft.maxSize,
          maxSizeBytes: parseSize(ft.maxSize),
        };
      }
      return config;
    },
  };
}
