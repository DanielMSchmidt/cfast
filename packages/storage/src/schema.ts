import type { FiletypeConfig } from "./types.js";

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
