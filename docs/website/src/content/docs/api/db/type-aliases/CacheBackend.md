---
editUrl: false
next: false
prev: false
title: "CacheBackend"
---

> **CacheBackend** = `"cache-api"` \| `"kv"`

Defined in: [packages/db/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/db/src/types.ts#L47)

Supported cache backend types for [CacheConfig](/api/db/type-aliases/cacheconfig/).

- `"cache-api"` — Edge-local Cloudflare Cache API (~0ms latency, per-edge-node).
- `"kv"` — Global Cloudflare KV (10-50ms latency, eventually consistent).
