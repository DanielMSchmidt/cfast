/**
 * Error thrown when a plugin's `setup()` function fails during `app.context()`.
 *
 * Wraps the original error with the plugin name for diagnostics.
 */
export class CfastPluginError extends Error {
  /** The name of the plugin whose `setup()` threw. */
  readonly pluginName: string;
  /** The original error thrown by the plugin. */
  override readonly cause: unknown;

  /**
   * @param pluginName - The name of the plugin that failed.
   * @param cause - The original error thrown by the plugin's `setup()`.
   */
  constructor(pluginName: string, cause: unknown) {
    const causeMessage =
      cause instanceof Error ? cause.message : String(cause);
    super(`Plugin "${pluginName}" setup failed: ${causeMessage}`);
    this.name = "CfastPluginError";
    this.pluginName = pluginName;
    this.cause = cause;
  }
}

/**
 * Error thrown for configuration issues detected at startup (e.g., duplicate plugin names).
 */
export class CfastConfigError extends Error {
  /**
   * @param message - Description of the configuration error.
   */
  constructor(message: string) {
    super(message);
    this.name = "CfastConfigError";
  }
}
