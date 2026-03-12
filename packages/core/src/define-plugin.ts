import type { CfastPlugin } from "./types";

export function definePlugin<TRequires = {}>(
  config: Omit<
    CfastPlugin<string, unknown, TRequires, unknown>,
    never
  > & {
    name: string;
    setup: (
      ctx: { request: Request; env: Record<string, unknown> } & TRequires,
    ) => unknown | Promise<unknown>;
  },
): typeof config {
  return config;
}
