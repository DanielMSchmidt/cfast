---
editUrl: false
next: false
prev: false
title: "OffsetParams"
---

> **OffsetParams** = `object`

Defined in: [packages/db/src/types.ts:247](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L247)

Parsed offset-based pagination parameters from a request URL.

Produced by [parseOffsetParams](/api/db/functions/parseoffsetparams/). Pass to `db.query(table).paginate()` for
traditional page-number-based pagination with total counts.

## Example

```ts
const params = parseOffsetParams(request, { defaultLimit: 20 });
const page = await db.query(posts).paginate(params).run({});
```

## Properties

### limit

> **limit**: `number`

Defined in: [packages/db/src/types.ts:253](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L253)

Maximum items per page (clamped between 1 and `maxLimit`).

***

### page

> **page**: `number`

Defined in: [packages/db/src/types.ts:251](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L251)

The 1-based page number.

***

### type

> **type**: `"offset"`

Defined in: [packages/db/src/types.ts:249](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L249)

Discriminant for offset-based pagination. Always `"offset"`.
