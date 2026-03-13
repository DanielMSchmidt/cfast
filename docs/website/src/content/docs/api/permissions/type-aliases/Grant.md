---
editUrl: false
next: false
prev: false
title: "Grant"
---

> **Grant** = `object`

Defined in: [packages/permissions/src/types.ts:79](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/permissions/src/types.ts#L79)

A single permission grant: an action on a subject, optionally restricted by a `where` clause.

## Properties

### action

> **action**: [`PermissionAction`](/api/permissions/type-aliases/permissionaction/)

Defined in: [packages/permissions/src/types.ts:81](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/permissions/src/types.ts#L81)

The permitted operation. `"manage"` is shorthand for all four CRUD actions.

***

### subject

> **subject**: [`DrizzleTable`](/api/permissions/type-aliases/drizzletable/) \| `"all"`

Defined in: [packages/permissions/src/types.ts:83](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/permissions/src/types.ts#L83)

The Drizzle table this grant applies to, or `"all"` for every table.

***

### where?

> `optional` **where**: [`WhereClause`](/api/permissions/type-aliases/whereclause/)

Defined in: [packages/permissions/src/types.ts:85](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/permissions/src/types.ts#L85)

Optional row-level filter that restricts which rows this grant covers.
