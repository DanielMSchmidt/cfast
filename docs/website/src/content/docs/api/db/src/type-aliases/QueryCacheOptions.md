---
editUrl: false
next: false
prev: false
title: "QueryCacheOptions"
---

> **QueryCacheOptions** = `false` \| \{ `staleWhileRevalidate?`: `string`; `tags?`: `string`[]; `ttl?`: `string`; \}

Defined in: [packages/db/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/db/src/types.ts#L50)

Per-query cache control. Pass `false` to skip caching, or an options object to customize.
