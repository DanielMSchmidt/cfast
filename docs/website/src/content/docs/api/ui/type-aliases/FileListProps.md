---
editUrl: false
next: false
prev: false
title: "FileListProps"
---

> **FileListProps** = `object`

Defined in: [packages/ui/src/types.ts:1276](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1276)

Props for the FileList component.

Displays a list of uploaded files with metadata, download links, and
permission-aware delete actions. Resolves download URLs from `@cfast/storage`
when a storage configuration is provided.

## See

 - [FileListFile](/api/ui/type-aliases/filelistfile/) for the shape of each file entry.
 - [FileFieldProps](/api/ui/type-aliases/filefieldprops/) for the inline field variant used in tables.

## Properties

### deleteAction?

> `optional` **deleteAction**: [`ClientDescriptor`](/api/actions/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:1282](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1282)

Action descriptor for the delete button on each file.

***

### files

> **files**: [`FileListFile`](/api/ui/type-aliases/filelistfile/)[]

Defined in: [packages/ui/src/types.ts:1278](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1278)

Array of file metadata to display.

***

### onDownload()?

> `optional` **onDownload**: (`file`) => `void`

Defined in: [packages/ui/src/types.ts:1284](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1284)

Custom download handler.

#### Parameters

##### file

[`FileListFile`](/api/ui/type-aliases/filelistfile/)

#### Returns

`void`

***

### storage?

> `optional` **storage**: `unknown`

Defined in: [packages/ui/src/types.ts:1280](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1280)

Storage configuration for download URL resolution.
