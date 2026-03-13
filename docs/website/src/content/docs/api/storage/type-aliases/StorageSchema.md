---
editUrl: false
next: false
prev: false
title: "StorageSchema"
---

> **StorageSchema** = `Record`\<`string`, [`FiletypeConfig`](/api/storage/type-aliases/filetypeconfig/)\<`any`\>\>

Defined in: [packages/storage/src/types.ts:158](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L158)

A record mapping file type names to their [FiletypeConfig](/api/storage/type-aliases/filetypeconfig/) definitions.

Used as the input to [defineStorage](/api/storage/functions/definestorage/) to declare the full storage schema.

## Remarks

Uses `any` for the input generic so that heterogeneous file types
with different `TInput` shapes can be collected in a single schema.
