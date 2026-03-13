---
editUrl: false
next: false
prev: false
title: "FiletypeHooks"
---

> **FiletypeHooks**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:42](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L42)

Lifecycle hooks for a file type, invoked during the upload pipeline.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

## Properties

### afterUpload()?

> `optional` **afterUpload**: (`result`, `ctx`) => `Promise`\<`void`\>

Defined in: [packages/storage/src/types.ts:46](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L46)

Called after a successful upload completes.

#### Parameters

##### result

[`UploadResult`](/api/storage/src/type-aliases/uploadresult/)

##### ctx

[`HandleContext`](/api/storage/src/type-aliases/handlecontext/)\<`TInput`\>

#### Returns

`Promise`\<`void`\>

***

### beforeUpload()?

> `optional` **beforeUpload**: (`file`, `ctx`) => `Promise`\<`void`\>

Defined in: [packages/storage/src/types.ts:44](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L44)

Called after validation but before bytes are written to R2.

#### Parameters

##### file

[`FileInfo`](/api/storage/src/type-aliases/fileinfo/)

##### ctx

[`HandleContext`](/api/storage/src/type-aliases/handlecontext/)\<`TInput`\>

#### Returns

`Promise`\<`void`\>
