import { useLoaderData, useFetcher } from "react-router";
import type {
  ClientDescriptor,
  ActionPermissionsMap,
  ActionPermissionStatus,
  Serializable,
} from "../types.js";

export type ActionHookResult = {
  permitted: boolean;
  invisible: boolean;
  reason: string | null;
  submit: () => void;
  pending: boolean;
  data: unknown | undefined;
  error: unknown | undefined;
};

export function useActions(
  descriptor: ClientDescriptor,
): Record<string, (input?: Serializable) => ActionHookResult> {
  const loaderData = useLoaderData() as Record<string, unknown>;
  const permissions = (loaderData?._actionPermissions ?? {}) as ActionPermissionsMap;

  // Pre-allocate one fetcher per action (hooks can't be in loops/conditions).
  // descriptor.actionNames is a static readonly array set at module init time,
  // so this always calls the same number of hooks in the same order.
  const fetchers = descriptor.actionNames.map(() => useFetcher());

  const result: Record<string, (input?: Serializable) => ActionHookResult> = {};

  for (let i = 0; i < descriptor.actionNames.length; i++) {
    const name = descriptor.actionNames[i];
    const fetcher = fetchers[i];
    const status: ActionPermissionStatus = permissions[name] ?? {
      permitted: true,
      invisible: false,
      reason: null,
    };

    result[name] = (input?: Serializable) => ({
      ...status,
      submit: () => {
        const formData = new FormData();
        formData.set("_action", name);
        if (input && typeof input === "object" && !Array.isArray(input)) {
          for (const [key, value] of Object.entries(
            input as Record<string, Serializable>,
          )) {
            if (value !== null && value !== undefined) {
              formData.set(key, String(value));
            }
          }
        }
        fetcher.submit(formData, { method: "POST" });
      },
      pending: fetcher.state !== "idle",
      data: fetcher.data,
      error: undefined,
    });
  }

  return result;
}
