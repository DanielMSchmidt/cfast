---
editUrl: false
next: false
prev: false
title: "QueryCacheOptions"
---

> **QueryCacheOptions** = `false` \| \{ `staleWhileRevalidate?`: `string`; `tags?`: `string`[]; `ttl?`: `string`; \}

Defined in: [packages/db/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L50)

Per-query cache control. Pass `false` to skip caching, or an options object to customize.
