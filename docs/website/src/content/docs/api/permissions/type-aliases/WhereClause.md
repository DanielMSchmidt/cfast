---
editUrl: false
next: false
prev: false
title: "WhereClause"
---

> **WhereClause** = (`columns`, `user`) => `DrizzleSQL` \| `undefined`

Defined in: [packages/permissions/src/types.ts:70](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L70)

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
