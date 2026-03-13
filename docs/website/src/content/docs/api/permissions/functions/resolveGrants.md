---
editUrl: false
next: false
prev: false
title: "resolveGrants"
---

> **resolveGrants**(`permissions`, `roles`): [`Grant`](/api/permissions/type-aliases/grant/)[]

Defined in: [packages/permissions/src/resolve-grants.ts:19](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/resolve-grants.ts#L19)

Resolves and merges grants for multiple roles into a single flat array.

Looks up each role's pre-expanded grants (from hierarchy resolution) and
deduplicates them by action + subject. When multiple grants share the same
action + subject:
- If **any** grant has no `where` clause, the merged grant is unrestricted.
- If **all** grants have `where` clauses, they are OR-merged via Drizzle's `or()`.

This is used when a user has multiple roles and their grants need to be combined.

## Parameters

### permissions

[`Permissions`](/api/permissions/type-aliases/permissions/)

The permissions object from [definePermissions](/api/permissions/functions/definepermissions/).

### roles

`string`[]

Array of role names whose grants should be merged.

## Returns

[`Grant`](/api/permissions/type-aliases/grant/)[]

A deduplicated array of [Grant](/api/permissions/type-aliases/grant/) objects with merged `where` clauses.
