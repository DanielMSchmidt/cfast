---
editUrl: false
next: false
prev: false
title: "OperationsFn"
---

> **OperationsFn**\<`TInput`, `TResult`, `TUser`\> = (`db`, `input`, `ctx`) => [`Operation`](/api/db/src/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/actions/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/actions/src/types.ts#L47)

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
