---
editUrl: false
next: false
prev: false
title: "KeyContext"
---

> **KeyContext**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L50)

Context passed to the `key` function when generating an R2 object key.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

## Properties

### input

> **input**: `TInput`

Defined in: [packages/storage/src/types.ts:54](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L54)

Caller-provided input data (e.g. a `postId`).

***

### user

> **user**: `object`

Defined in: [packages/storage/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L52)

The authenticated user performing the upload.

#### Index Signature

\[`key`: `string`\]: `unknown`

#### id

> **id**: `string`
