---
editUrl: false
next: false
prev: false
title: "WhereClause"
---

> **WhereClause** = (`columns`, `user`) => `DrizzleSQL` \| `undefined`

Defined in: [packages/permissions/src/types.ts:41](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/permissions/src/types.ts#L41)

A function that produces a Drizzle `WHERE` clause for row-level permission filtering.

## Parameters

### columns

`Record`\<`string`, `unknown`\>

The table's column references for building filter expressions.

### user

`any`

The current user object (from `@cfast/auth`).

## Returns

`DrizzleSQL` \| `undefined`

A Drizzle SQL expression to restrict matching rows, or `undefined` for no restriction.
