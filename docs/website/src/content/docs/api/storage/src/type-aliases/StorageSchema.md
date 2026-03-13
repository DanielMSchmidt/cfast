---
editUrl: false
next: false
prev: false
title: "StorageSchema"
---

> **StorageSchema** = `Record`\<`string`, [`FiletypeConfig`](/api/storage/src/type-aliases/filetypeconfig/)\<`any`\>\>

Defined in: [packages/storage/src/types.ts:95](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L95)

A record of named file type configurations, used as the input to [defineStorage](/api/storage/src/functions/definestorage/).

## Remarks

Uses `any` for the input generic so that heterogeneous file types can be collected.
