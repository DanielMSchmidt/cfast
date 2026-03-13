---
editUrl: false
next: false
prev: false
title: "PermissionCheckResult"
---

> **PermissionCheckResult** = `object`

Defined in: [packages/permissions/src/types.ts:87](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/permissions/src/types.ts#L87)

Result of a permission check via [checkPermissions](/api/permissions/src/functions/checkpermissions/).

## Properties

### denied

> **denied**: [`PermissionDescriptor`](/api/permissions/src/type-aliases/permissiondescriptor/)[]

Defined in: [packages/permissions/src/types.ts:91](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/permissions/src/types.ts#L91)

The descriptors that were not satisfied.

***

### permitted

> **permitted**: `boolean`

Defined in: [packages/permissions/src/types.ts:89](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/permissions/src/types.ts#L89)

`true` only if every descriptor in the check was satisfied.

***

### reasons

> **reasons**: `string`[]

Defined in: [packages/permissions/src/types.ts:93](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/permissions/src/types.ts#L93)

Human-readable reasons for each denial.
