---
editUrl: false
next: false
prev: false
title: "ParsedEnv"
---

> **ParsedEnv**\<`S`\> = `{ [K in keyof S]: BindingTypeMap[S[K]["type"]] }`

Defined in: [packages/env/src/types.ts:76](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/env/src/types.ts#L76)

Mapped type that resolves a schema to its validated environment object.

Each key in the schema maps to the TypeScript type corresponding to its
binding type (e.g., a `d1` binding becomes `D1Database`).

## Type Parameters

### S

`S` *extends* [`Schema`](/api/env/src/type-aliases/schema/)
