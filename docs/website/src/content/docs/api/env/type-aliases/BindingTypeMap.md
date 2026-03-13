---
editUrl: false
next: false
prev: false
title: "BindingTypeMap"
---

> **BindingTypeMap** = `object`

Defined in: [packages/env/src/types.ts:14](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L14)

Maps each Cloudflare binding type string to its corresponding TypeScript type.

Uses global types from `@cloudflare/workers-types` (peer dependency).
Consumers must have `@cloudflare/workers-types` installed for full type safety.

## Example

```typescript
// Access the TypeScript type for a specific binding type:
type MyD1 = BindingTypeMap["d1"]; // D1Database
type MyKV = BindingTypeMap["kv"]; // KVNamespace
```

## Properties

### d1

> **d1**: `D1Database`

Defined in: [packages/env/src/types.ts:16](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L16)

Cloudflare D1 SQLite database.

***

### durable-object

> **durable-object**: `DurableObjectNamespace`

Defined in: [packages/env/src/types.ts:24](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L24)

Cloudflare Durable Object namespace.

***

### kv

> **kv**: `KVNamespace`

Defined in: [packages/env/src/types.ts:18](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L18)

Cloudflare Workers KV key-value namespace.

***

### queue

> **queue**: `Queue`

Defined in: [packages/env/src/types.ts:22](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L22)

Cloudflare Queue for message passing.

***

### r2

> **r2**: `R2Bucket`

Defined in: [packages/env/src/types.ts:20](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L20)

Cloudflare R2 object storage bucket.

***

### secret

> **secret**: `string`

Defined in: [packages/env/src/types.ts:28](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L28)

A secret string value (non-empty, set via `wrangler secret put`).

***

### service

> **service**: `Fetcher`

Defined in: [packages/env/src/types.ts:26](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L26)

Cloudflare Service binding (Worker-to-Worker RPC).

***

### var

> **var**: `string`

Defined in: [packages/env/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/env/src/types.ts#L30)

A string environment variable (set via `[vars]` in `wrangler.toml`).
