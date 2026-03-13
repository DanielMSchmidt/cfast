---
editUrl: false
next: false
prev: false
title: "Permissions"
---

> **Permissions**\<`TRoles`\> = `object`

Defined in: [packages/permissions/src/types.ts:123](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L123)

The resolved permissions object returned by [definePermissions](/api/permissions/src/functions/definepermissions/).

Contains the original roles and grants, plus the hierarchy-expanded `resolvedGrants`.

## Type Parameters

### TRoles

`TRoles` *extends* readonly `string`[] = readonly `string`[]

Tuple of role name string literals.

## Properties

### grants

> **grants**: `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/src/type-aliases/grant/)[]\>

Defined in: [packages/permissions/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L129)

The raw grants as declared (before hierarchy expansion).

***

### resolvedGrants

> **resolvedGrants**: `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/src/type-aliases/grant/)[]\>

Defined in: [packages/permissions/src/types.ts:131](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L131)

Grants expanded with inherited grants from the role hierarchy.

***

### roles

> **roles**: `TRoles`

Defined in: [packages/permissions/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L127)

The role names from the configuration.
