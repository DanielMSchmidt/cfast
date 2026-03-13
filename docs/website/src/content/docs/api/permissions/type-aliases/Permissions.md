---
editUrl: false
next: false
prev: false
title: "Permissions"
---

> **Permissions**\<`TRoles`\> = `object`

Defined in: [packages/permissions/src/types.ts:165](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L165)

The resolved permissions object returned by [definePermissions](/api/permissions/functions/definepermissions/).

Contains the original roles and grants, plus the hierarchy-expanded `resolvedGrants`.
Pass this to `createDb()` for server-side enforcement or import it on the client
for UI-level permission introspection.

## Type Parameters

### TRoles

`TRoles` *extends* readonly `string`[] = readonly `string`[]

Tuple of role name string literals.

## Properties

### grants

> **grants**: `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/type-aliases/grant/)[]\>

Defined in: [packages/permissions/src/types.ts:171](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L171)

The raw grants as declared (before hierarchy expansion).

***

### resolvedGrants

> **resolvedGrants**: `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/type-aliases/grant/)[]\>

Defined in: [packages/permissions/src/types.ts:173](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L173)

Grants expanded with inherited grants from the role hierarchy.

***

### roles

> **roles**: `TRoles`

Defined in: [packages/permissions/src/types.ts:169](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L169)

The role names from the configuration.
