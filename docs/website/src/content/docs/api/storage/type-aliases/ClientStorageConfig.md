---
editUrl: false
next: false
prev: false
title: "ClientStorageConfig"
---

> **ClientStorageConfig** = `Record`\<`string`, [`ClientFiletypeConfig`](/api/storage/type-aliases/clientfiletypeconfig/)\>

Defined in: [packages/storage/src/types.ts:181](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L181)

A record of client-safe file type configs, keyed by file type name.

Passed to the `StorageProvider` to make schema information available to `useUpload`.
