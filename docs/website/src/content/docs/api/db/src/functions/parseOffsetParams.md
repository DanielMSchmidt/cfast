---
editUrl: false
next: false
prev: false
title: "parseOffsetParams"
---

> **parseOffsetParams**(`request`, `options?`): [`OffsetParams`](/api/db/src/type-aliases/offsetparams/)

Defined in: [packages/db/src/paginate.ts:65](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/paginate.ts#L65)

Parses offset-based pagination parameters from a request URL's search params.

Reads `page` and `limit` from the URL. Clamps `limit` between 1 and `maxLimit`, and
ensures `page` is at least 1.

## Parameters

### request

`Request`

The incoming HTTP request whose URL contains pagination params.

### options?

`PaginationOptions`

Optional defaults and limits for pagination.

## Returns

[`OffsetParams`](/api/db/src/type-aliases/offsetparams/)

Parsed `OffsetParams` with `type`, `page`, and `limit`.

## Example

```ts
const params = parseOffsetParams(request, { defaultLimit: 20 });
const page = await db.query(posts).paginate(params).run({});
```
