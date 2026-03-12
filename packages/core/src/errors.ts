export class CfastPluginError extends Error {
  readonly pluginName: string;
  override readonly cause: unknown;

  constructor(pluginName: string, cause: unknown) {
    const causeMessage =
      cause instanceof Error ? cause.message : String(cause);
    super(`Plugin "${pluginName}" setup failed: ${causeMessage}`);
    this.name = "CfastPluginError";
    this.pluginName = pluginName;
    this.cause = cause;
  }
}

export class CfastConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CfastConfigError";
  }
}
