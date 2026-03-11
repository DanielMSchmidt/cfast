import type { FiletypeConfig, StorageSchema, StorageInstance, ClientStorageConfig, HandleContext } from "./types.js";
import { handleUpload } from "./handle.js";
import { serveFile, getPublicUrl as getPublicUrlFn, createSignedUrl, verifySignedUrl as verifySignedUrlFn } from "./serve.js";

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
};

export function parseSize(size: string): number {
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid size format: "${size}". Expected format: "10mb", "1.5kb", etc.`);
  }
  const value = parseFloat(match[1]);
  const unit = match[2];
  return Math.round(value * SIZE_UNITS[unit]);
}

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
