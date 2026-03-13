---
editUrl: false
next: false
prev: false
title: "StorageErrorOptions"
---

> **StorageErrorOptions** = `object`

Defined in: [packages/storage/src/types.ts:19](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L19)

Options used to construct a [StorageError](/api/storage/classes/storageerror/).

Combines a machine-readable code, human-readable detail, and an HTTP status
code so that errors can be surfaced directly in API responses.

## Properties

### code

> **code**: [`StorageErrorCode`](/api/storage/type-aliases/storageerrorcode/)

Defined in: [packages/storage/src/types.ts:21](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L21)

Machine-readable error code.

***

### detail

> **detail**: `string`

Defined in: [packages/storage/src/types.ts:23](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L23)

Human-readable description of the problem.

***

### status

> **status**: `number`

Defined in: [packages/storage/src/types.ts:25](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L25)

HTTP status code to surface to the client (e.g. 413, 415, 500).
