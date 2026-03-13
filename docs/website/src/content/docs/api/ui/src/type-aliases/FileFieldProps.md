---
editUrl: false
next: false
prev: false
title: "FileFieldProps"
---

> **FileFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:521](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/types.ts#L521)

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
