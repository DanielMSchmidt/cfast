---
editUrl: false
next: false
prev: false
title: "FileInfo"
---

> **FileInfo** = `object`

Defined in: [packages/storage/src/types.ts:123](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L123)

Metadata about a file extracted from the incoming multipart request.

Passed to the `beforeUpload` hook with the file's identity and size
before any bytes are written to R2.

## Properties

### extension

> **extension**: `string`

Defined in: [packages/storage/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L127)

File extension without the leading dot (e.g. `"jpg"`).

***

### name

> **name**: `string`

Defined in: [packages/storage/src/types.ts:125](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L125)

Original file name (e.g. `"photo.jpg"`).

***

### size

> **size**: `number`

Defined in: [packages/storage/src/types.ts:131](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L131)

File size in bytes.

***

### type

> **type**: `string`

Defined in: [packages/storage/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/storage/src/types.ts#L129)

MIME type from the file metadata (e.g. `"image/jpeg"`).
