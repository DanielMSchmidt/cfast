---
editUrl: false
next: false
prev: false
title: "CursorParams"
---

> **CursorParams** = `object`

Defined in: [packages/db/src/types.ts:226](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L226)

Parsed cursor-based pagination parameters from a request URL.

Produced by [parseCursorParams](/api/db/functions/parsecursorparams/). Pass to `db.query(table).paginate()` for
keyset pagination that avoids the offset performance cliff on large datasets.

## Example

```ts
const params = parseCursorParams(request, { defaultLimit: 20 });
const page = await db.query(posts).paginate(params).run({});
```

## Properties

### cursor

> **cursor**: `string` \| `null`

Defined in: [packages/db/src/types.ts:230](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L230)

The opaque cursor string from the previous page, or `null` for the first page.

***

### limit

> **limit**: `number`

Defined in: [packages/db/src/types.ts:232](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L232)

Maximum items per page (clamped between 1 and `maxLimit`).

***

### type

> **type**: `"cursor"`

Defined in: [packages/db/src/types.ts:228](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L228)

Discriminant for cursor-based pagination. Always `"cursor"`.
