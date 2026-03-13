---
editUrl: false
next: false
prev: false
title: "compose"
---

> **compose**\<`TResult`\>(`operations`, `executor`): [`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/db/src/compose.ts:6](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/compose.ts#L6)

## Type Parameters

### TResult

`TResult`

## Parameters

### operations

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>[]

### executor

(...`runs`) => `TResult` \| `Promise`\<`TResult`\>

## Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>
