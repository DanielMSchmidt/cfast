---
editUrl: false
next: false
prev: false
title: "checkPermissions"
---

> **checkPermissions**(`role`, `permissions`, `descriptors`): [`PermissionCheckResult`](/api/permissions/type-aliases/permissioncheckresult/)

Defined in: [packages/permissions/src/check.ts:71](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/check.ts#L71)

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

[`Permissions`](/api/permissions/type-aliases/permissions/)

The permissions object from [definePermissions](/api/permissions/functions/definepermissions/).

### descriptors

[`PermissionDescriptor`](/api/permissions/type-aliases/permissiondescriptor/)[]

Array of permission descriptors to check against.

## Returns

[`PermissionCheckResult`](/api/permissions/type-aliases/permissioncheckresult/)

A [PermissionCheckResult](/api/permissions/type-aliases/permissioncheckresult/) with `permitted`, `denied`, and `reasons`.

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
