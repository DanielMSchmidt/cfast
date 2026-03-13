---
editUrl: false
next: false
prev: false
title: "FileInfo"
---

> **FileInfo** = `object`

Defined in: [packages/storage/src/types.ts:68](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L68)

Metadata about a file extracted from the incoming request.

## Properties

### extension

> **extension**: `string`

Defined in: [packages/storage/src/types.ts:72](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L72)

File extension without the leading dot (e.g. `"jpg"`).

***

### name

> **name**: `string`

Defined in: [packages/storage/src/types.ts:70](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L70)

Original file name (e.g. `"photo.jpg"`).

***

### size

> **size**: `number`

Defined in: [packages/storage/src/types.ts:76](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L76)

File size in bytes.

***

### type

> **type**: `string`

Defined in: [packages/storage/src/types.ts:74](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L74)

MIME type from the file metadata (e.g. `"image/jpeg"`).
