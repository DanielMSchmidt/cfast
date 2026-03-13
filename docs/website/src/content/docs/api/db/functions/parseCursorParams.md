---
editUrl: false
next: false
prev: false
title: "parseCursorParams"
---

> **parseCursorParams**(`request`, `options?`): [`CursorParams`](/api/db/type-aliases/cursorparams/)

Defined in: [packages/db/src/paginate.ts:46](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/paginate.ts#L46)

Parses cursor-based pagination parameters from a request URL's search params.

Reads `cursor` and `limit` from the URL query string. Clamps `limit` between 1 and `maxLimit`.
Returns a [CursorParams](/api/db/type-aliases/cursorparams/) object ready to pass to `db.query(table).paginate()`.

## Parameters

### request

`Request`

The incoming HTTP request whose URL contains `?cursor=...&limit=...`.

### options?

`PaginationOptions`

Optional defaults and limits for pagination.

## Returns

[`CursorParams`](/api/db/type-aliases/cursorparams/)

Parsed [CursorParams](/api/db/type-aliases/cursorparams/) with `type`, `cursor`, and `limit`.

## Example

```ts
import { parseCursorParams } from "@cfast/db";

const params = parseCursorParams(request, { defaultLimit: 20, maxLimit: 100 });
const page = await db.query(posts).paginate(params).run({});
// page => { items: [...], nextCursor: "..." | null }
```
