---
editUrl: false
next: false
prev: false
title: "FiletypeConfig"
---

> **FiletypeConfig**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:18](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L18)

Configuration for a single file type within a storage schema.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

## Properties

### accept

> **accept**: readonly `string`[]

Defined in: [packages/storage/src/types.ts:22](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L22)

MIME types accepted for this file type (e.g. `["image/jpeg", "image/png"]`).

***

### bucket

> **bucket**: `string`

Defined in: [packages/storage/src/types.ts:20](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L20)

R2 binding name from the Workers environment (e.g. `"UPLOADS"`).

***

### hooks?

> `optional` **hooks**: [`FiletypeHooks`](/api/storage/src/type-aliases/filetypehooks/)\<`TInput`\>

Defined in: [packages/storage/src/types.ts:38](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L38)

Lifecycle hooks that run before and after upload.

***

### key()

> **key**: (`file`, `ctx`) => `string`

Defined in: [packages/storage/src/types.ts:26](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L26)

Function that generates the R2 object key for an uploaded file.

#### Parameters

##### file

###### extension

`string`

###### name

`string`

##### ctx

[`KeyContext`](/api/storage/src/type-aliases/keycontext/)\<`TInput`\>

#### Returns

`string`

***

### maxSize

> **maxSize**: `string`

Defined in: [packages/storage/src/types.ts:24](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L24)

Maximum file size as a human-readable string (e.g. `"10mb"`, `"500kb"`).

***

### multipartThreshold?

> `optional` **multipartThreshold**: `string`

Defined in: [packages/storage/src/types.ts:32](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L32)

File size above which multipart upload is used (default `"5mb"`).

***

### partSize?

> `optional` **partSize**: `string`

Defined in: [packages/storage/src/types.ts:34](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L34)

Size of each part in a multipart upload (default `"10mb"`).

***

### publicUrl?

> `optional` **publicUrl**: `string`

Defined in: [packages/storage/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L36)

Base URL for publicly accessible files (used by `getPublicUrl`).

***

### replace?

> `optional` **replace**: `boolean`

Defined in: [packages/storage/src/types.ts:28](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L28)

When `true`, uploading replaces all existing files under the same key prefix.

***

### uploadable?

> `optional` **uploadable**: `boolean`

Defined in: [packages/storage/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L30)

When `false`, the file type cannot be uploaded directly (e.g. system-generated exports).
