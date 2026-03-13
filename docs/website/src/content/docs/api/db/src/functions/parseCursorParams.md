---
editUrl: false
next: false
prev: false
title: "parseCursorParams"
---

> **parseCursorParams**(`request`, `options?`): [`CursorParams`](/api/db/src/type-aliases/cursorparams/)

Defined in: [packages/db/src/paginate.ts:35](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/paginate.ts#L35)

Parses cursor-based pagination parameters from a request URL's search params.

Reads `cursor` and `limit` from the URL. Clamps `limit` between 1 and `maxLimit`.

## Parameters

### request

`Request`

The incoming HTTP request whose URL contains pagination params.

### options?

`PaginationOptions`

Optional defaults and limits for pagination.

## Returns

[`CursorParams`](/api/db/src/type-aliases/cursorparams/)

Parsed `CursorParams` with `type`, `cursor`, and `limit`.

## Example

```ts
const params = parseCursorParams(request, { defaultLimit: 20, maxLimit: 100 });
const page = await db.query(posts).paginate(params).run({});
```
