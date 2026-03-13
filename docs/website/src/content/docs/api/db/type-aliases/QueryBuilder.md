---
editUrl: false
next: false
prev: false
title: "QueryBuilder"
---

> **QueryBuilder** = `object`

Defined in: [packages/db/src/types.ts:428](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L428)

Builder for read queries on a single table.

Returned by `db.query(table)`. Provides `findMany`, `findFirst`, and `paginate` methods
that each return an [Operation](/api/db/type-aliases/operation/) with permission-aware execution.

## Example

```ts
const builder = db.query(posts);

// Fetch all visible posts
const all = await builder.findMany().run({});

// Fetch a single post
const post = await builder.findFirst({ where: eq(posts.id, id) }).run({});

// Paginate
const page = await builder.paginate(params, { orderBy: desc(posts.createdAt) }).run({});
```

## Properties

### findFirst()

> **findFirst**: (`options?`) => [`Operation`](/api/db/type-aliases/operation/)\<`unknown` \| `undefined`\>

Defined in: [packages/db/src/types.ts:432](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L432)

Returns an [Operation](/api/db/type-aliases/operation/) that fetches the first matching row, or `undefined` if none match.

#### Parameters

##### options?

[`FindFirstOptions`](/api/db/type-aliases/findfirstoptions/)

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`unknown` \| `undefined`\>

***

### findMany()

> **findMany**: (`options?`) => [`Operation`](/api/db/type-aliases/operation/)\<`unknown`[]\>

Defined in: [packages/db/src/types.ts:430](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L430)

Returns an [Operation](/api/db/type-aliases/operation/) that fetches multiple rows matching the given options.

#### Parameters

##### options?

[`FindManyOptions`](/api/db/type-aliases/findmanyoptions/)

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<`unknown`[]\>

***

### paginate()

> **paginate**: (`params`, `options?`) => [`Operation`](/api/db/type-aliases/operation/)\<[`CursorPage`](/api/db/type-aliases/cursorpage/)\<`unknown`\>\> \| [`Operation`](/api/db/type-aliases/operation/)\<[`OffsetPage`](/api/db/type-aliases/offsetpage/)\<`unknown`\>\>

Defined in: [packages/db/src/types.ts:439](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L439)

Returns a paginated [Operation](/api/db/type-aliases/operation/) using either cursor-based or offset-based strategy.

The return type depends on the `params.type` discriminant: [CursorPage](/api/db/type-aliases/cursorpage/) for `"cursor"`,
[OffsetPage](/api/db/type-aliases/offsetpage/) for `"offset"`.

#### Parameters

##### params

[`CursorParams`](/api/db/type-aliases/cursorparams/) | [`OffsetParams`](/api/db/type-aliases/offsetparams/)

##### options?

[`PaginateOptions`](/api/db/type-aliases/paginateoptions/)

#### Returns

[`Operation`](/api/db/type-aliases/operation/)\<[`CursorPage`](/api/db/type-aliases/cursorpage/)\<`unknown`\>\> \| [`Operation`](/api/db/type-aliases/operation/)\<[`OffsetPage`](/api/db/type-aliases/offsetpage/)\<`unknown`\>\>
