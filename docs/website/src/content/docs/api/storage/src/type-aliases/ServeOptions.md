---
editUrl: false
next: false
prev: false
title: "ServeOptions"
---

> **ServeOptions** = `object`

Defined in: [packages/storage/src/types.ts:119](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L119)

Options for serving a file directly from R2.

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:121](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L121)

Workers environment bindings (must include the target R2 bucket).

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/storage/src/types.ts:123](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/storage/src/types.ts#L123)

Additional response headers to include (e.g. `Cache-Control`).
