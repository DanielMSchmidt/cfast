---
editUrl: false
next: false
prev: false
title: "defineStorage"
---

> **defineStorage**\<`T`\>(`schema`): [`StorageInstance`](/api/storage/src/type-aliases/storageinstance/)\<`T`\>

Defined in: [packages/storage/src/schema.ts:87](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/schema.ts#L87)

Create a type-safe storage instance from a schema of named file types.

The returned instance provides `handle` (upload), `serve`, `getPublicUrl`,
`getSignedUrl`, `verifySignedUrl`, and `clientConfig` methods that are all
scoped to the declared schema.

## Type Parameters

### T

`T` *extends* [`StorageSchema`](/api/storage/src/type-aliases/storageschema/)

## Parameters

### schema

`T`

A record mapping file type names to their [FiletypeConfig](/api/storage/src/type-aliases/filetypeconfig/).

## Returns

[`StorageInstance`](/api/storage/src/type-aliases/storageinstance/)\<`T`\>

A [StorageInstance](/api/storage/src/type-aliases/storageinstance/) with methods for uploads, serving, and URL generation.

## Example

```ts
import { defineStorage, filetype } from "@cfast/storage";

export const storage = defineStorage({
  avatars: filetype({
    bucket: "UPLOADS",
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSize: "2mb",
    key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
    replace: true,
  }),
});
```
