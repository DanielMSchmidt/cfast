---
editUrl: false
next: false
prev: false
title: "filetype"
---

> **filetype**\<`TInput`\>(`config`): [`FiletypeConfig`](/api/storage/type-aliases/filetypeconfig/)\<`TInput`\> & `object`

Defined in: [packages/storage/src/schema.ts:64](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/schema.ts#L64)

Define a file type with its constraints and key generation strategy.

Applies defaults for optional fields: `uploadable` defaults to `true`,
`replace` to `false`, `multipartThreshold` to `"5mb"`, and `partSize` to `"10mb"`.

## Type Parameters

### TInput

`TInput` = `Record`\<`string`, `unknown`\>

The shape of caller-provided input available in the `key` function and hooks.

## Parameters

### config

[`FiletypeConfig`](/api/storage/type-aliases/filetypeconfig/)\<`TInput`\>

The file type configuration.

## Returns

[`FiletypeConfig`](/api/storage/type-aliases/filetypeconfig/)\<`TInput`\> & `object`

The config with defaults applied, fully resolved.

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
