---
editUrl: false
next: false
prev: false
title: "UsePaginationOptions"
---

> **UsePaginationOptions**\<`T`\> = `object`

Defined in: [packages/pagination/src/use-pagination.ts:14](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-pagination.ts#L14)

Options for the [usePagination](/api/pagination/functions/usepagination/) hook.

## Type Parameters

### T

`T`

The item type in the paginated list.

## Properties

### getKey()?

> `optional` **getKey**: (`item`) => `string` \| `number`

Defined in: [packages/pagination/src/use-pagination.ts:16](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/pagination/src/use-pagination.ts#L16)

Extracts a unique key from each item for deduplication. Defaults to `item.id`.

#### Parameters

##### item

`T`

#### Returns

`string` \| `number`
