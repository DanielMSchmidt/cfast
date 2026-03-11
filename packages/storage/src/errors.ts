import type { StorageErrorCode, StorageErrorOptions } from "./types.js";

export class StorageError extends Error {
  readonly name = "StorageError";
  readonly code: StorageErrorCode;
  readonly detail: string;
  readonly status: number;

  constructor(options: StorageErrorOptions) {
    super(options.detail);
    this.code = options.code;
    this.detail = options.detail;
    this.status = options.status;
  }
}
