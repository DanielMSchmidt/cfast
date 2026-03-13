---
editUrl: false
next: false
prev: false
title: "checkPermissions"
---

> **checkPermissions**(`role`, `permissions`, `descriptors`): [`PermissionCheckResult`](/api/permissions/src/type-aliases/permissioncheckresult/)

Defined in: [packages/permissions/src/check.ts:71](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/check.ts#L71)

Checks whether a role satisfies a set of permission descriptors.

This is the low-level structural checking function. It determines whether a
role has *any* matching grant for each descriptor (action + table), without
evaluating row-level `where` clauses. Row-level enforcement happens at
execution time in `@cfast/db`.

## Parameters

### role

`string`

The role to check (e.g., `"user"`, `"admin"`).

### permissions

[`Permissions`](/api/permissions/src/type-aliases/permissions/)

The permissions object from [definePermissions](/api/permissions/src/functions/definepermissions/).

### descriptors

[`PermissionDescriptor`](/api/permissions/src/type-aliases/permissiondescriptor/)[]

Array of permission descriptors to check against.

## Returns

[`PermissionCheckResult`](/api/permissions/src/type-aliases/permissioncheckresult/)

A [PermissionCheckResult](/api/permissions/src/type-aliases/permissioncheckresult/) with `permitted`, `denied`, and `reasons`.

## Example

```typescript
import { checkPermissions, definePermissions, grant } from "@cfast/permissions";

const permissions = definePermissions({
  roles: ["user", "admin"] as const,
  grants: {
    user: [grant("read", posts), grant("create", posts)],
    admin: [grant("manage", "all")],
  },
});

const result = checkPermissions("user", permissions, [
  { action: "update", table: posts },
]);
result.permitted; // false
result.denied;    // [{ action: "update", table: posts }]
```
