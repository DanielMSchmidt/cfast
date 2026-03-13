---
editUrl: false
next: false
prev: false
title: "KeyContext"
---

> **KeyContext**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:93](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L93)

Context passed to the `key` function when generating an R2 object key.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

The shape of caller-provided input data.

## Properties

### input

> **input**: `TInput`

Defined in: [packages/storage/src/types.ts:97](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L97)

Caller-provided input data (e.g. a `postId`).

***

### user

> **user**: `object`

Defined in: [packages/storage/src/types.ts:95](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L95)

The authenticated user performing the upload.

#### Index Signature

\[`key`: `string`\]: `unknown`

#### id

> **id**: `string`
