---
editUrl: false
next: false
prev: false
title: "OperationsFn"
---

> **OperationsFn**\<`TInput`, `TResult`, `TUser`\> = (`db`, `input`, `ctx`) => [`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/actions/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L47)

## Type Parameters

### TInput

`TInput`

### TResult

`TResult`

### TUser

`TUser`

## Parameters

### db

[`Db`](/api/db/src/type-aliases/db/)

### input

`TInput`

### ctx

[`ActionContext`](/api/actions/src/type-aliases/actioncontext/)\<`TUser`\>

## Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>
