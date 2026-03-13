---
editUrl: false
next: false
prev: false
title: "CacheBackend"
---

> **CacheBackend** = `"cache-api"` \| `"kv"`

Defined in: [packages/db/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/db/src/types.ts#L47)

Supported cache backend types for [CacheConfig](/api/db/type-aliases/cacheconfig/).

- `"cache-api"` — Edge-local Cloudflare Cache API (~0ms latency, per-edge-node).
- `"kv"` — Global Cloudflare KV (10-50ms latency, eventually consistent).
