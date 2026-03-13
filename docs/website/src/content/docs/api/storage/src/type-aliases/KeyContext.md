---
editUrl: false
next: false
prev: false
title: "KeyContext"
---

> **KeyContext**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L50)

Context passed to the `key` function when generating an R2 object key.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

## Properties

### input

> **input**: `TInput`

Defined in: [packages/storage/src/types.ts:54](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L54)

Caller-provided input data (e.g. a `postId`).

***

### user

> **user**: `object`

Defined in: [packages/storage/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L52)

The authenticated user performing the upload.

#### Index Signature

\[`key`: `string`\]: `unknown`

#### id

> **id**: `string`
