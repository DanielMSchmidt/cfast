---
editUrl: false
next: false
prev: false
title: "StorageSchema"
---

> **StorageSchema** = `Record`\<`string`, [`FiletypeConfig`](/api/storage/type-aliases/filetypeconfig/)\<`any`\>\>

Defined in: [packages/storage/src/types.ts:158](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L158)

A record mapping file type names to their [FiletypeConfig](/api/storage/type-aliases/filetypeconfig/) definitions.

Used as the input to [defineStorage](/api/storage/functions/definestorage/) to declare the full storage schema.

## Remarks

Uses `any` for the input generic so that heterogeneous file types
with different `TInput` shapes can be collected in a single schema.
