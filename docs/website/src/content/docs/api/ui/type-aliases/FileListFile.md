---
editUrl: false
next: false
prev: false
title: "FileListFile"
---

> **FileListFile** = `object`

Defined in: [packages/ui/src/types.ts:1253](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1253)

Metadata for a single file in a [FileListProps](/api/ui/type-aliases/filelistprops/).

Contains the file identifier, display name, optional size/type metadata,
and an optional direct download URL.

## See

[FileListProps](/api/ui/type-aliases/filelistprops/) which renders an array of these entries.

## Properties

### key

> **key**: `string`

Defined in: [packages/ui/src/types.ts:1255](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1255)

Unique file identifier.

***

### name

> **name**: `string`

Defined in: [packages/ui/src/types.ts:1257](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1257)

Display name of the file.

***

### size?

> `optional` **size**: `number`

Defined in: [packages/ui/src/types.ts:1259](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1259)

File size in bytes.

***

### type?

> `optional` **type**: `string`

Defined in: [packages/ui/src/types.ts:1261](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1261)

MIME type of the file.

***

### url?

> `optional` **url**: `string`

Defined in: [packages/ui/src/types.ts:1263](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L1263)

Direct download URL.
