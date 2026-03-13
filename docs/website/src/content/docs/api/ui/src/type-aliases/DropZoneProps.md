---
editUrl: false
next: false
prev: false
title: "DropZoneProps"
---

> **DropZoneProps** = `object`

Defined in: [packages/ui/src/types.ts:758](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L758)

Props for the DropZone component.
Integrates with `useUpload()` from `@cfast/storage/client`.

## Properties

### children?

> `optional` **children**: `ReactNode`

Defined in: [packages/ui/src/types.ts:781](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L781)

Custom content to display inside the drop zone.

***

### multiple?

> `optional` **multiple**: `boolean`

Defined in: [packages/ui/src/types.ts:779](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L779)

Whether to allow multiple file uploads.

***

### upload

> **upload**: `object`

Defined in: [packages/ui/src/types.ts:760](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L760)

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
