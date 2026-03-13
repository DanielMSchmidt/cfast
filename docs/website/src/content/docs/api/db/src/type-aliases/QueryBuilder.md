---
editUrl: false
next: false
prev: false
title: "QueryBuilder"
---

> **QueryBuilder** = `object`

Defined in: [packages/db/src/types.ts:194](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L194)

Builder for read queries on a single table.

## Properties

### findFirst()

> **findFirst**: (`options?`) => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown` \| `undefined`\>

Defined in: [packages/db/src/types.ts:198](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L198)

Returns an operation that fetches the first matching row, or `undefined`.

#### Parameters

##### options?

[`FindFirstOptions`](/api/db/src/type-aliases/findfirstoptions/)

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown` \| `undefined`\>

***

### findMany()

> **findMany**: (`options?`) => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`[]\>

Defined in: [packages/db/src/types.ts:196](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L196)

Returns an operation that fetches multiple rows.

#### Parameters

##### options?

[`FindManyOptions`](/api/db/src/type-aliases/findmanyoptions/)

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`[]\>

***

### paginate()

> **paginate**: (`params`, `options?`) => [`Operation`](/api/db/src/type-aliases/operation/)\<[`CursorPage`](/api/db/src/type-aliases/cursorpage/)\<`unknown`\>\> \| [`Operation`](/api/db/src/type-aliases/operation/)\<[`OffsetPage`](/api/db/src/type-aliases/offsetpage/)\<`unknown`\>\>

Defined in: [packages/db/src/types.ts:200](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L200)

Returns a paginated operation (cursor-based or offset-based).

#### Parameters

##### params

[`CursorParams`](/api/db/src/type-aliases/cursorparams/) | [`OffsetParams`](/api/db/src/type-aliases/offsetparams/)

##### options?

[`PaginateOptions`](/api/db/src/type-aliases/paginateoptions/)

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<[`CursorPage`](/api/db/src/type-aliases/cursorpage/)\<`unknown`\>\> \| [`Operation`](/api/db/src/type-aliases/operation/)\<[`OffsetPage`](/api/db/src/type-aliases/offsetpage/)\<`unknown`\>\>
