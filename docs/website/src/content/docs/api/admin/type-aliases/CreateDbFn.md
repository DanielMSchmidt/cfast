---
editUrl: false
next: false
prev: false
title: "CreateDbFn"
---

> **CreateDbFn** = (`grants`, `user`) => [`Db`](/api/db/type-aliases/db/)

Defined in: [packages/admin/src/types.ts:107](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L107)

Factory function that creates a permission-scoped [Db](/api/db/type-aliases/db/) instance per request.

The admin calls this on every request with the authenticated user's grants
and identity so that all CRUD operations respect your permission system.

## Parameters

### grants

`unknown`[]

The permission grants resolved for the current user.

### user

The authenticated user, or `null` for unauthenticated access.

\{ `id`: `string`; \} | `null`

## Returns

[`Db`](/api/db/type-aliases/db/)

A [Db](/api/db/type-aliases/db/) instance scoped to the user's permissions.

## Example

```typescript
const db: CreateDbFn = (grants, user) =>
  createDb({ d1: env.DB, schema, grants, user });
```
