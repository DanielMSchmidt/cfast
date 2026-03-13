---
editUrl: false
next: false
prev: false
title: "filetype"
---

> **filetype**\<`TInput`\>(`config`): [`FiletypeConfig`](/api/storage/src/type-aliases/filetypeconfig/)\<`TInput`\> & `object`

Defined in: [packages/storage/src/schema.ts:50](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/schema.ts#L50)

Define a file type with its constraints and key generation strategy.

Applies defaults for optional fields (`uploadable`, `replace`, `multipartThreshold`, `partSize`).

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

## Parameters

### config

[`FiletypeConfig`](/api/storage/src/type-aliases/filetypeconfig/)\<`TInput`\>

The file type configuration.

## Returns

[`FiletypeConfig`](/api/storage/src/type-aliases/filetypeconfig/)\<`TInput`\> & `object`

The config with defaults applied.

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
