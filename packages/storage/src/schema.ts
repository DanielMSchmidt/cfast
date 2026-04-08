import type {
  FiletypeConfig,
  StorageSchema,
  StorageInstance,
  ClientStorageConfig,
  HandleContext,
  MimeGroupsRecord,
  MimeGroupedFiletypeOptions,
  NormalizedMimeGroup,
} from "./types.js";
import { handleUpload } from "./handle.js";
import {
  serveFile,
  getPublicUrl as getPublicUrlFn,
  createSignedUrl,
  verifySignedUrl as verifySignedUrlFn,
  createInstanceSignedUrl,
  verifyInstanceSignedToken,
} from "./serve.js";

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
 * Type guard — detects the per-mime form of {@link filetype} input, which is
 * a `Record<string, { mimes, maxSize }>` rather than a {@link FiletypeConfig}.
 */
function isMimeGroupsRecord(input: unknown): input is MimeGroupsRecord {
  if (!input || typeof input !== "object") return false;
  const asRecord = input as Record<string, unknown>;
  // Old form has these required scalar fields.
  if ("bucket" in asRecord || "accept" in asRecord || "maxSize" in asRecord || "key" in asRecord) {
    return false;
  }
  // New form has at least one value that looks like a MimeGroup.
  for (const value of Object.values(asRecord)) {
    if (
      value &&
      typeof value === "object" &&
      "mimes" in (value as Record<string, unknown>) &&
      "maxSize" in (value as Record<string, unknown>) &&
      Array.isArray((value as { mimes: unknown }).mimes)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Normalize a {@link MimeGroupsRecord} into the internal flattened shape,
 * computing `accept` (union of all mimes) and `maxSize` (the largest group)
 * plus a pre-parsed list of `mimeGroups` for per-mime validation.
 */
function normalizeMimeGroups(record: MimeGroupsRecord): {
  accept: readonly string[];
  maxSize: string;
  mimeGroups: readonly NormalizedMimeGroup[];
} {
  const entries = Object.values(record);
  if (entries.length === 0) {
    throw new Error("filetype(): mime groups record must contain at least one group");
  }
  const accept: string[] = [];
  const mimeGroups: NormalizedMimeGroup[] = [];
  let maxBytes = 0;
  let maxSizeString = entries[0].maxSize;

  for (const group of entries) {
    if (!Array.isArray(group.mimes) || group.mimes.length === 0) {
      throw new Error("filetype(): every mime group must declare at least one mime type");
    }
    const bytes = parseSize(group.maxSize);
    mimeGroups.push({ mimes: group.mimes, maxSize: group.maxSize, maxSizeBytes: bytes });
    for (const mime of group.mimes) {
      if (!accept.includes(mime)) accept.push(mime);
    }
    if (bytes > maxBytes) {
      maxBytes = bytes;
      maxSizeString = group.maxSize;
    }
  }

  return { accept, maxSize: maxSizeString, mimeGroups };
}

/**
 * Define a file type with its constraints and key generation strategy.
 *
 * Two forms are supported:
 *
 * 1. **Single-limit form** — accepts one `accept` list and one `maxSize`
 *    string. All accepted MIME types share the same size limit.
 * 2. **Per-mime form** — accepts a record of named MIME groups, each with
 *    its own `maxSize`, plus a second argument for bucket/key/hooks. Use
 *    this when (for example) images must be 10 MB but PDFs may be 50 MB.
 *
 * Applies defaults for optional fields: `uploadable` defaults to `true`,
 * `replace` to `false`, `multipartThreshold` to `"5mb"`, and `partSize` to
 * `"10mb"`.
 *
 * @typeParam TInput - The shape of caller-provided input available in the `key` function and hooks.
 * @returns The config with defaults applied, fully resolved.
 *
 * @example Single-limit form
 * ```ts
 * const avatars = filetype({
 *   bucket: "UPLOADS",
 *   accept: ["image/jpeg", "image/png", "image/webp"],
 *   maxSize: "2mb",
 *   key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
 * });
 * ```
 *
 * @example Per-mime form (different limits per group)
 * ```ts
 * const assets = filetype(
 *   {
 *     image: { mimes: ["image/jpeg", "image/png", "image/webp"], maxSize: "10mb" },
 *     document: { mimes: ["application/pdf"], maxSize: "50mb" },
 *   },
 *   {
 *     bucket: "UPLOADS",
 *     key: (file, ctx) => `assets/${ctx.user.id}/${file.name}`,
 *   },
 * );
 * ```
 */
export function filetype<TInput = Record<string, unknown>>(
  config: FiletypeConfig<TInput>,
): FiletypeConfig<TInput> & {
  uploadable: boolean;
  replace: boolean;
  multipartThreshold: string;
  partSize: string;
};
export function filetype<TInput = Record<string, unknown>>(
  groups: MimeGroupsRecord,
  options: MimeGroupedFiletypeOptions<TInput>,
): FiletypeConfig<TInput> & {
  uploadable: boolean;
  replace: boolean;
  multipartThreshold: string;
  partSize: string;
};
export function filetype<TInput = Record<string, unknown>>(
  configOrGroups: FiletypeConfig<TInput> | MimeGroupsRecord,
  options?: MimeGroupedFiletypeOptions<TInput>,
): FiletypeConfig<TInput> & {
  uploadable: boolean;
  replace: boolean;
  multipartThreshold: string;
  partSize: string;
} {
  if (isMimeGroupsRecord(configOrGroups)) {
    if (!options) {
      throw new Error(
        "filetype(): the per-mime form requires a second argument with at least `bucket` and `key`",
      );
    }
    const { accept, maxSize, mimeGroups } = normalizeMimeGroups(configOrGroups);
    return {
      bucket: options.bucket,
      accept,
      maxSize,
      key: options.key,
      replace: options.replace ?? false,
      uploadable: options.uploadable ?? true,
      multipartThreshold: options.multipartThreshold ?? "5mb",
      partSize: options.partSize ?? "10mb",
      publicUrl: options.publicUrl,
      hooks: options.hooks,
      ownerCheck: options.ownerCheck,
      mimeGroups,
    };
  }

  const config = configOrGroups as FiletypeConfig<TInput>;
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

    handle: async (name, source, ctx) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      if (config.uploadable === false) throw new Error(`Filetype "${String(name)}" is not uploadable`);
      return handleUpload(config, source, ctx as HandleContext<unknown>);
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

    signedUrl: async (key, options) => {
      const secret = (options.env as Record<string, string>)["STORAGE_SECRET"];
      if (!secret) throw new Error("STORAGE_SECRET binding not found in env");
      return createInstanceSignedUrl(key, secret, options.expiresIn, options.basePath);
    },

    verifySignedToken: async (key, token, options) => {
      const secret = (options.env as Record<string, string>)["STORAGE_SECRET"];
      if (!secret) throw new Error("STORAGE_SECRET binding not found in env");
      return verifyInstanceSignedToken(key, token, secret);
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
