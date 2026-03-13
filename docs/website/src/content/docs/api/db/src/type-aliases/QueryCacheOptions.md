---
editUrl: false
next: false
prev: false
title: "QueryCacheOptions"
---

> **QueryCacheOptions** = `false` \| \{ `staleWhileRevalidate?`: `string`; `tags?`: `string`[]; `ttl?`: `string`; \}

Defined in: [packages/db/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/db/src/types.ts#L50)

Per-query cache control. Pass `false` to skip caching, or an options object to customize.
