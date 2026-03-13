---
editUrl: false
next: false
prev: false
title: "Grant"
---

> **Grant** = `object`

Defined in: [packages/permissions/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L50)

A single permission grant: an action on a subject, optionally restricted by a `where` clause.

## Properties

### action

> **action**: [`PermissionAction`](/api/permissions/src/type-aliases/permissionaction/)

Defined in: [packages/permissions/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L52)

The permitted operation. `"manage"` is shorthand for all four CRUD actions.

***

### subject

> **subject**: [`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/) \| `"all"`

Defined in: [packages/permissions/src/types.ts:54](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L54)

The Drizzle table this grant applies to, or `"all"` for every table.

***

### where?

> `optional` **where**: [`WhereClause`](/api/permissions/src/type-aliases/whereclause/)

Defined in: [packages/permissions/src/types.ts:56](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L56)

Optional row-level filter that restricts which rows this grant covers.
