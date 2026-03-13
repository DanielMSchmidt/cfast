---
editUrl: false
next: false
prev: false
title: "FiletypeHooks"
---

> **FiletypeHooks**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:81](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L81)

Lifecycle hooks for a file type, invoked during the upload pipeline.

Use `beforeUpload` for pre-processing (e.g. quota checks, image resizing)
and `afterUpload` for post-processing (e.g. saving to the database,
triggering a queue).

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

The shape of caller-provided input available in the hook context.

## Properties

### afterUpload()?

> `optional` **afterUpload**: (`result`, `ctx`) => `Promise`\<`void`\>

Defined in: [packages/storage/src/types.ts:85](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L85)

Called after a successful upload completes.

#### Parameters

##### result

[`UploadResult`](/api/storage/type-aliases/uploadresult/)

##### ctx

[`HandleContext`](/api/storage/type-aliases/handlecontext/)\<`TInput`\>

#### Returns

`Promise`\<`void`\>

***

### beforeUpload()?

> `optional` **beforeUpload**: (`file`, `ctx`) => `Promise`\<`void`\>

Defined in: [packages/storage/src/types.ts:83](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L83)

Called after validation but before bytes are written to R2.

#### Parameters

##### file

[`FileInfo`](/api/storage/type-aliases/fileinfo/)

##### ctx

[`HandleContext`](/api/storage/type-aliases/handlecontext/)\<`TInput`\>

#### Returns

`Promise`\<`void`\>
