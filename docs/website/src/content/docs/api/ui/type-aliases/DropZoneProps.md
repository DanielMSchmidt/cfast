---
editUrl: false
next: false
prev: false
title: "DropZoneProps"
---

> **DropZoneProps** = `object`

Defined in: [packages/ui/src/types.ts:1190](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1190)

Props for the DropZone component.

Integrates with `useUpload()` from `@cfast/storage/client` for drag-and-drop
file uploads. Inherits `accept` and `maxSize` constraints from the storage schema.
Manages drag state, file preview, validation errors, and upload progress internally.

## See

 - [DropZoneSlotProps](/api/ui/type-aliases/dropzoneslotprops/) for the underlying plugin slot.
 - [ImagePreviewProps](/api/ui/type-aliases/imagepreviewprops/) for displaying uploaded images.
 - [FileListProps](/api/ui/type-aliases/filelistprops/) for displaying uploaded file lists.

## Properties

### children?

> `optional` **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:1213](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1213)

Custom content to display inside the drop zone.

***

### multiple?

> `optional` **multiple**: `boolean`

Defined in: [packages/ui/src/types.ts:1211](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1211)

Whether to allow multiple file uploads.

***

### upload

> **upload**: `object`

Defined in: [packages/ui/src/types.ts:1192](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L1192)

Upload hook result from `@cfast/storage/client`.

#### accept

> **accept**: `string`

MIME type filter for accepted files.

#### error

> **error**: `string` \| `null`

Upload error message, if any.

#### isUploading

> **isUploading**: `boolean`

Whether an upload is in progress.

#### progress

> **progress**: `number`

Current upload progress (0-100).

#### reset()

> **reset**: () => `void`

Reset the upload state.

##### Returns

`void`

#### result

> **result**: `unknown` \| `null`

Upload result when complete.

#### start()

> **start**: (`file`) => `void`

Start uploading a file.

##### Parameters

###### file

`File`

##### Returns

`void`

#### validationError

> **validationError**: `string` \| `null`

Client-side validation error, if any.
