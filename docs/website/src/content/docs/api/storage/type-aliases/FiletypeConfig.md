---
editUrl: false
next: false
prev: false
title: "FiletypeConfig"
---

> **FiletypeConfig**\<`TInput`\> = `object`

Defined in: [packages/storage/src/types.ts:49](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L49)

Configuration for a single file type within a storage schema.

Defines the R2 bucket, accepted MIME types, size limits, key generation
strategy, and optional lifecycle hooks for a category of files.

## Example

```ts
import { filetype } from "@cfast/storage";

const avatars = filetype({
  bucket: "UPLOADS",
  accept: ["image/jpeg", "image/png", "image/webp"],
  maxSize: "2mb",
  key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
  replace: true,
});
```

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

The shape of caller-provided input available in the `key` function and hooks.

## Properties

### accept

> **accept**: readonly `string`[]

Defined in: [packages/storage/src/types.ts:53](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L53)

MIME types accepted for this file type (e.g. `["image/jpeg", "image/png"]`).

***

### bucket

> **bucket**: `string`

Defined in: [packages/storage/src/types.ts:51](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L51)

R2 binding name from the Workers environment (e.g. `"UPLOADS"`).

***

### hooks?

> `optional` **hooks**: [`FiletypeHooks`](/api/storage/type-aliases/filetypehooks/)\<`TInput`\>

Defined in: [packages/storage/src/types.ts:69](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L69)

Lifecycle hooks that run before and after upload.

***

### key()

> **key**: (`file`, `ctx`) => `string`

Defined in: [packages/storage/src/types.ts:57](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L57)

Function that generates the R2 object key for an uploaded file.

#### Parameters

##### file

###### extension

`string`

###### name

`string`

##### ctx

[`KeyContext`](/api/storage/type-aliases/keycontext/)\<`TInput`\>

#### Returns

`string`

***

### maxSize

> **maxSize**: `string`

Defined in: [packages/storage/src/types.ts:55](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L55)

Maximum file size as a human-readable string (e.g. `"10mb"`, `"500kb"`).

***

### multipartThreshold?

> `optional` **multipartThreshold**: `string`

Defined in: [packages/storage/src/types.ts:63](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L63)

File size above which multipart upload is used (default `"5mb"`).

***

### partSize?

> `optional` **partSize**: `string`

Defined in: [packages/storage/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L65)

Size of each part in a multipart upload (default `"10mb"`).

***

### publicUrl?

> `optional` **publicUrl**: `string`

Defined in: [packages/storage/src/types.ts:67](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L67)

Base URL for publicly accessible files (used by `getPublicUrl`).

***

### replace?

> `optional` **replace**: `boolean`

Defined in: [packages/storage/src/types.ts:59](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L59)

When `true`, uploading replaces all existing files under the same key prefix.

***

### uploadable?

> `optional` **uploadable**: `boolean`

Defined in: [packages/storage/src/types.ts:61](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L61)

When `false`, the file type cannot be uploaded directly (e.g. system-generated exports).
