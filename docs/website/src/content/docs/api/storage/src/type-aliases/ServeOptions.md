---
editUrl: false
next: false
prev: false
title: "ServeOptions"
---

> **ServeOptions** = `object`

Defined in: [packages/storage/src/types.ts:119](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L119)

Options for serving a file directly from R2.

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:121](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L121)

Workers environment bindings (must include the target R2 bucket).

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/storage/src/types.ts:123](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L123)

Additional response headers to include (e.g. `Cache-Control`).
