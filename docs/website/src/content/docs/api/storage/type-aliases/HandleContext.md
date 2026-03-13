---
editUrl: false
next: false
prev: false
title: "HandleContext"
---

> **HandleContext**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:108](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L108)

Context required by the upload handler and lifecycle hooks.

Passed to [StorageInstance.handle](/api/storage/type-aliases/storageinstance/#handle) to provide access to env bindings,
the authenticated user, and optional caller-provided input.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

The shape of caller-provided input data.

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:110](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L110)

Workers environment bindings (must include the target R2 bucket).

***

### input?

> `optional` **input**: `TInput`

Defined in: [packages/storage/src/types.ts:114](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L114)

Optional caller-provided input available in the `key` function and hooks.

***

### user

> **user**: `object`

Defined in: [packages/storage/src/types.ts:112](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L112)

The authenticated user performing the upload.

#### Index Signature

\[`key`: `string`\]: `unknown`

#### id

> **id**: `string`
