---
editUrl: false
next: false
prev: false
title: "FileListProps"
---

> **FileListProps** = `object`

Defined in: [packages/ui/src/types.ts:819](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L819)

Props for the FileList component.

## Properties

### deleteAction?

> `optional` **deleteAction**: [`ClientDescriptor`](/api/actions/src/type-aliases/clientdescriptor/)

Defined in: [packages/ui/src/types.ts:825](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L825)

Action descriptor for the delete button on each file.

***

### files

> **files**: [`FileListFile`](/api/ui/src/type-aliases/filelistfile/)[]

Defined in: [packages/ui/src/types.ts:821](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L821)

Array of file metadata to display.

***

### onDownload()?

> `optional` **onDownload**: (`file`) => `void`

Defined in: [packages/ui/src/types.ts:827](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L827)

Custom download handler.

#### Parameters

##### file

[`FileListFile`](/api/ui/src/type-aliases/filelistfile/)

#### Returns

`void`

***

### storage?

> `optional` **storage**: `unknown`

Defined in: [packages/ui/src/types.ts:823](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L823)

Storage configuration for download URL resolution.
