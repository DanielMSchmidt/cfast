import type { Operation } from "@cfast/db";
import type { PermissionDescriptor } from "@cfast/permissions";

export function createMockOperation<T>(
  result: T,
  permissions: PermissionDescriptor[] = [],
): Operation<T> {
  return {
    permissions,
    run: async () => result,
  };
}

export function createFormDataRequest(
  data: Record<string, string>,
  method = "POST",
): Request {
  const body = new URLSearchParams(data);
  return new Request("https://test.example.com", {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

export function createJsonRequest(
  data: Record<string, unknown>,
  method = "POST",
): Request {
  return new Request("https://test.example.com", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
