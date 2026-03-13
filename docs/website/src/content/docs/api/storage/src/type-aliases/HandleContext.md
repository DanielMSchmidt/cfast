---
editUrl: false
next: false
prev: false
title: "HandleContext"
---

> **HandleContext**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:58](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L58)

Context required by the upload handler and lifecycle hooks.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:60](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L60)

Workers environment bindings (must include the target R2 bucket).

***

### input?

> `optional` **input**: `TInput`

Defined in: [packages/storage/src/types.ts:64](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L64)

Optional caller-provided input available in the `key` function and hooks.

***

### user

> **user**: `object`

Defined in: [packages/storage/src/types.ts:62](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L62)

The authenticated user performing the upload.

#### Index Signature

\[`key`: `string`\]: `unknown`

#### id

> **id**: `string`
