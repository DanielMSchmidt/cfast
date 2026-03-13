---
editUrl: false
next: false
prev: false
title: "FileFieldProps"
---

> **FileFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:521](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L521)

Props for the FileField read-only display component.

## Type Declaration

### fileName?

> `optional` **fileName**: `string`

Display name for the file. Defaults to the value.

### fileSize?

> `optional` **fileSize**: `number`

File size in bytes for formatted display.

### storage?

> `optional` **storage**: `unknown`

Storage configuration for download URL resolution.

### value

> **value**: `string` \| `null` \| `undefined`

File key or path.
