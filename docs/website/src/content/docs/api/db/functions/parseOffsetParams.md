---
editUrl: false
next: false
prev: false
title: "parseOffsetParams"
---

> **parseOffsetParams**(`request`, `options?`): [`OffsetParams`](/api/db/type-aliases/offsetparams/)

Defined in: [packages/db/src/paginate.ts:80](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/paginate.ts#L80)

Parses offset-based pagination parameters from a request URL's search params.

Reads `page` and `limit` from the URL query string. Clamps `limit` between 1 and `maxLimit`,
and ensures `page` is at least 1. Returns an [OffsetParams](/api/db/type-aliases/offsetparams/) object ready to pass
to `db.query(table).paginate()`.

## Parameters

### request

`Request`

The incoming HTTP request whose URL contains `?page=...&limit=...`.

### options?

`PaginationOptions`

Optional defaults and limits for pagination.

## Returns

[`OffsetParams`](/api/db/type-aliases/offsetparams/)

Parsed [OffsetParams](/api/db/type-aliases/offsetparams/) with `type`, `page`, and `limit`.

## Example

```ts
import { parseOffsetParams } from "@cfast/db";

const params = parseOffsetParams(request, { defaultLimit: 20 });
const page = await db.query(posts).paginate(params).run({});
// page => { items: [...], total: 100, page: 1, totalPages: 5 }
```
