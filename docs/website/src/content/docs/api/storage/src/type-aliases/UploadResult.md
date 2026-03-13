---
editUrl: false
next: false
prev: false
title: "UploadResult"
---

> **UploadResult** = `object`

Defined in: [packages/storage/src/types.ts:80](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L80)

Result returned after a successful file upload to R2.

## Properties

### key

> **key**: `string`

Defined in: [packages/storage/src/types.ts:82](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L82)

The R2 object key where the file was stored.

***

### size

> **size**: `number`

Defined in: [packages/storage/src/types.ts:84](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L84)

Actual file size in bytes (verified via streaming byte count).

***

### type

> **type**: `string`

Defined in: [packages/storage/src/types.ts:86](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L86)

MIME type of the uploaded file.
