import type { EnvValidationError } from "./types";

export class EnvError extends Error {
  readonly errors: EnvValidationError[];

  constructor(errors: EnvValidationError[]) {
    const summary = errors.map((e) => `  - ${e.key}: ${e.message}`).join("\n");
    super(`@cfast/env: ${errors.length} binding error(s):\n${summary}`);
    this.name = "EnvError";
    this.errors = errors;
  }
}
