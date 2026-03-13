---
editUrl: false
next: false
prev: false
title: "UsePaginationOptions"
---

> **UsePaginationOptions**\<`T`\> = `object`

Defined in: [packages/pagination/src/use-pagination.ts:14](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/pagination/src/use-pagination.ts#L14)

Options for the [usePagination](/api/pagination/functions/usepagination/) hook.

## Type Parameters

### T

`T`

The item type in the paginated list.

## Properties

### getKey()?

> `optional` **getKey**: (`item`) => `string` \| `number`

Defined in: [packages/pagination/src/use-pagination.ts:16](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/pagination/src/use-pagination.ts#L16)

Extracts a unique key from each item for deduplication. Defaults to `item.id`.

#### Parameters

##### item

`T`

#### Returns

`string` \| `number`
