---
editUrl: false
next: false
prev: false
title: "FileFieldProps"
---

> **FileFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:802](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L802)

Props for the FileField read-only display component.

Displays a file icon, name, and formatted size. Resolves download URLs from
`@cfast/storage` when a storage configuration is provided.

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

## See

 - [FileListProps](/api/ui/type-aliases/filelistprops/) for displaying multiple files with actions.
 - [BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
