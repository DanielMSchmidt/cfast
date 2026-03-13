---
editUrl: false
next: false
prev: false
title: "PermissionCheckResult"
---

> **PermissionCheckResult** = `object`

Defined in: [packages/permissions/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L127)

Result of a permission check via [checkPermissions](/api/permissions/functions/checkpermissions/).

## Properties

### denied

> **denied**: [`PermissionDescriptor`](/api/permissions/type-aliases/permissiondescriptor/)[]

Defined in: [packages/permissions/src/types.ts:131](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L131)

The descriptors that were not satisfied.

***

### permitted

> **permitted**: `boolean`

Defined in: [packages/permissions/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L129)

`true` only if every descriptor in the check was satisfied.

***

### reasons

> **reasons**: `string`[]

Defined in: [packages/permissions/src/types.ts:133](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L133)

Human-readable reasons for each denial.
