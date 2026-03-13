---
editUrl: false
next: false
prev: false
title: "StorageErrorOptions"
---

> **StorageErrorOptions** = `object`

Defined in: [packages/storage/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L8)

Options used to construct a [StorageError](/api/storage/src/classes/storageerror/).

## Properties

### code

> **code**: [`StorageErrorCode`](/api/storage/src/type-aliases/storageerrorcode/)

Defined in: [packages/storage/src/types.ts:10](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L10)

Machine-readable error code.

***

### detail

> **detail**: `string`

Defined in: [packages/storage/src/types.ts:12](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L12)

Human-readable description of the problem.

***

### status

> **status**: `number`

Defined in: [packages/storage/src/types.ts:14](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L14)

HTTP status code to surface to the client (e.g. 413, 415, 500).
