---
editUrl: false
next: false
prev: false
title: "BindingTypeMap"
---

> **BindingTypeMap** = `object`

Defined in: [packages/env/src/types.ts:7](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L7)

Maps each Cloudflare binding type string to its corresponding TypeScript type.

Uses global types from `@cloudflare/workers-types` (peer dependency).
Consumers must have `@cloudflare/workers-types` installed for full type safety.

## Properties

### d1

> **d1**: `D1Database`

Defined in: [packages/env/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L8)

***

### durable-object

> **durable-object**: `DurableObjectNamespace`

Defined in: [packages/env/src/types.ts:12](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L12)

***

### kv

> **kv**: `KVNamespace`

Defined in: [packages/env/src/types.ts:9](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L9)

***

### queue

> **queue**: `Queue`

Defined in: [packages/env/src/types.ts:11](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L11)

***

### r2

> **r2**: `R2Bucket`

Defined in: [packages/env/src/types.ts:10](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L10)

***

### secret

> **secret**: `string`

Defined in: [packages/env/src/types.ts:14](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L14)

***

### service

> **service**: `Fetcher`

Defined in: [packages/env/src/types.ts:13](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L13)

***

### var

> **var**: `string`

Defined in: [packages/env/src/types.ts:15](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/env/src/types.ts#L15)
