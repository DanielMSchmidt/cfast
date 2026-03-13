---
editUrl: false
next: false
prev: false
title: "StorageErrorOptions"
---

> **StorageErrorOptions** = `object`

Defined in: [packages/storage/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L8)

Options used to construct a [StorageError](/api/storage/src/classes/storageerror/).

## Properties

### code

> **code**: [`StorageErrorCode`](/api/storage/src/type-aliases/storageerrorcode/)

Defined in: [packages/storage/src/types.ts:10](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L10)

Machine-readable error code.

***

### detail

> **detail**: `string`

Defined in: [packages/storage/src/types.ts:12](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L12)

Human-readable description of the problem.

***

### status

> **status**: `number`

Defined in: [packages/storage/src/types.ts:14](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L14)

HTTP status code to surface to the client (e.g. 413, 415, 500).
