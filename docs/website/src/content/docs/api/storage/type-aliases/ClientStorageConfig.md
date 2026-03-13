---
editUrl: false
next: false
prev: false
title: "ClientStorageConfig"
---

> **ClientStorageConfig** = `Record`\<`string`, [`ClientFiletypeConfig`](/api/storage/type-aliases/clientfiletypeconfig/)\>

Defined in: [packages/storage/src/types.ts:181](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L181)

A record of client-safe file type configs, keyed by file type name.

Passed to the `StorageProvider` to make schema information available to `useUpload`.
