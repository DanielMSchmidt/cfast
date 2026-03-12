import type { EnvValidationError } from "./types";

/**
 * Error thrown when one or more Cloudflare Worker bindings fail validation.
 *
 * Contains all validation failures so they can be fixed in a single pass.
 * The `message` includes a formatted summary of every failing binding.
 */
export class EnvError extends Error {
  /** All binding validation failures that caused this error. */
  readonly errors: EnvValidationError[];

  /**
   * Creates a new `EnvError` from one or more validation failures.
   *
   * @param errors - Array of validation failures, one per misconfigured binding.
   */
  constructor(errors: EnvValidationError[]) {
    const summary = errors.map((e) => `  - ${e.key}: ${e.message}`).join("\n");
    super(`@cfast/env: ${errors.length} binding error(s):\n${summary}`);
    this.name = "EnvError";
    this.errors = errors;
  }
}
