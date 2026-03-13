import type { StorageErrorCode, StorageErrorOptions } from "./types.js";

/**
 * Typed error thrown by the storage validation and upload pipeline.
 *
 * Includes a machine-readable {@link StorageError.code | code}, a human-readable
 * {@link StorageError.detail | detail}, and an HTTP {@link StorageError.status | status}
 * suitable for returning to the client.
 *
 * @example
 * ```ts
 * import { StorageError } from "@cfast/storage";
 *
 * try {
 *   await storage.handle("avatars", request, { env, user });
 * } catch (e) {
 *   if (e instanceof StorageError) {
 *     console.error(e.code);    // "FILE_TOO_LARGE"
 *     console.error(e.detail);  // "File is 5.2MB but max allowed is 2.0MB"
 *     console.error(e.status);  // 413
 *   }
 * }
 * ```
 */
export class StorageError extends Error {
  readonly name = "StorageError";
  /** Machine-readable error code (e.g. `"FILE_TOO_LARGE"`). */
  readonly code: StorageErrorCode;
  /** Human-readable description of the problem. */
  readonly detail: string;
  /** HTTP status code (e.g. 413, 415, 500). */
  readonly status: number;

  /**
   * @param options - Error details including code, detail message, and HTTP status.
   */
  constructor(options: StorageErrorOptions) {
    super(options.detail);
    this.code = options.code;
    this.detail = options.detail;
    this.status = options.status;
  }
}
