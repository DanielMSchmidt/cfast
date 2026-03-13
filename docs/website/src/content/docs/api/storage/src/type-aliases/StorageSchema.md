---
editUrl: false
next: false
prev: false
title: "StorageSchema"
---

> **StorageSchema** = `Record`\<`string`, [`FiletypeConfig`](/api/storage/src/type-aliases/filetypeconfig/)\<`any`\>\>

Defined in: [packages/storage/src/types.ts:95](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L95)

A record of named file type configurations, used as the input to [defineStorage](/api/storage/src/functions/definestorage/).

## Remarks

Uses `any` for the input generic so that heterogeneous file types can be collected.
