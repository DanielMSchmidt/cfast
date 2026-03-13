---
editUrl: false
next: false
prev: false
title: "defineStorage"
---

> **defineStorage**\<`T`\>(`schema`): [`StorageInstance`](/api/storage/type-aliases/storageinstance/)\<`T`\>

Defined in: [packages/storage/src/schema.ts:102](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/schema.ts#L102)

Create a type-safe storage instance from a schema of named file types.

The returned instance provides `handle` (upload), `serve`, `getPublicUrl`,
`getSignedUrl`, `verifySignedUrl`, and `clientConfig` methods that are all
scoped to the declared schema.

## Type Parameters

### T

`T` *extends* [`StorageSchema`](/api/storage/type-aliases/storageschema/)

The storage schema type, inferred from the `schema` argument.

## Parameters

### schema

`T`

A record mapping file type names to their [FiletypeConfig](/api/storage/type-aliases/filetypeconfig/).

## Returns

[`StorageInstance`](/api/storage/type-aliases/storageinstance/)\<`T`\>

A [StorageInstance](/api/storage/type-aliases/storageinstance/) with methods for uploads, serving, and URL generation.

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
