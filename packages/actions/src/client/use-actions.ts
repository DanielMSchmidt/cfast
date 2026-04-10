import { useLoaderData, useFetcher } from "react-router";
import type {
  ClientDescriptor,
  ActionPermissionsMap,
  ActionPermissionStatus,
  Serializable,
} from "../types.js";

/**
 * Creates a ClientDescriptor for use in client code without importing
 * server modules. The action names must match the keys passed to
 * `composeActions` or the single action name from `createAction`.
 *
 * Pass a `readonly` tuple (`as const`) to get compile-time type-checking
 * of action names throughout the client code:
 *
 * ```ts
 * const client = clientDescriptor(["create", "delete"] as const);
 * // client is ClientDescriptor<readonly ["create", "delete"]>
 * ```
 */
export function clientDescriptor<const TNames extends readonly string[]>(
  actionNames: TNames,
): ClientDescriptor<TNames> {
  return {
    _brand: "ActionClientDescriptor",
    actionNames,
    permissionsKey: "_actionPermissions",
  };
}

export type ActionHookResult = {
  permitted: boolean;
  invisible: boolean;
  reason: string | null;
  submit: () => void;
  pending: boolean;
  data: unknown | undefined;
  error: unknown | undefined;
};

/**
 * Narrows an `unknown` value to `Record<string, unknown>` if it is a non-null object.
 * Returns an empty object otherwise so callers always get a safe record to index into.
 */
function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * Validates that an `unknown` value has the shape of an {@link ActionPermissionStatus}.
 */
function isPermissionStatus(v: unknown): v is ActionPermissionStatus {
  if (v === null || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.permitted === "boolean" &&
    typeof obj.invisible === "boolean" &&
    (obj.reason === null || typeof obj.reason === "string")
  );
}

/**
 * Extracts an {@link ActionPermissionsMap} from raw loader data.
 * Returns an empty map if the data does not contain valid permissions.
 */
function extractPermissions(loaderData: Record<string, unknown>): ActionPermissionsMap {
  const raw = loaderData._actionPermissions;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const map: ActionPermissionsMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isPermissionStatus(value)) {
      map[key] = value;
    }
  }
  return map;
}

export function useActions<const TNames extends readonly string[]>(
  descriptor: ClientDescriptor<TNames>,
): { [K in TNames[number]]: (input?: Serializable) => ActionHookResult } {
  const loaderData = asRecord(useLoaderData());
  const permissions = extractPermissions(loaderData);

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
          const entries = Object.entries(input);
          for (const [key, value] of entries) {
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

  return result as { [K in TNames[number]]: (input?: Serializable) => ActionHookResult };
}
