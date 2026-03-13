---
editUrl: false
next: false
prev: false
title: "UploadResult"
---

> **UploadResult** = `object`

Defined in: [packages/storage/src/types.ts:140](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L140)

Result returned after a successful file upload to R2.

Contains the R2 object key, the verified byte count, and the MIME type.
Passed to the `afterUpload` hook and returned from [StorageInstance.handle](/api/storage/type-aliases/storageinstance/#handle).

## Properties

### key

> **key**: `string`

Defined in: [packages/storage/src/types.ts:142](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L142)

The R2 object key where the file was stored.

***

### size

> **size**: `number`

Defined in: [packages/storage/src/types.ts:144](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L144)

Actual file size in bytes (verified via streaming byte count).

***

### type

> **type**: `string`

Defined in: [packages/storage/src/types.ts:146](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L146)

MIME type of the uploaded file.
