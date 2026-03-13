---
editUrl: false
next: false
prev: false
title: "OperationsFn"
---

> **OperationsFn**\<`TInput`, `TResult`, `TUser`\> = (`db`, `input`, `ctx`) => [`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/actions/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/actions/src/types.ts#L47)

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
