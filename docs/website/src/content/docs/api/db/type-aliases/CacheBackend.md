---
editUrl: false
next: false
prev: false
title: "CacheBackend"
---

> **CacheBackend** = `"cache-api"` \| `"kv"`

Defined in: [packages/db/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L47)

Supported cache backend types for [CacheConfig](/api/db/type-aliases/cacheconfig/).

- `"cache-api"` — Edge-local Cloudflare Cache API (~0ms latency, per-edge-node).
- `"kv"` — Global Cloudflare KV (10-50ms latency, eventually consistent).
