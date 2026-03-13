---
editUrl: false
next: false
prev: false
title: "RequestArgs"
---

> **RequestArgs** = `object`

Defined in: [packages/actions/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/actions/src/types.ts#L30)

Subset of React Router loader/action arguments used by `@cfast/actions`.

## Properties

### context?

> `optional` **context**: `unknown`

Defined in: [packages/actions/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/actions/src/types.ts#L36)

Optional context (e.g. Cloudflare Workers env).

***

### params

> **params**: `Record`\<`string`, `string` \| `undefined`\>

Defined in: [packages/actions/src/types.ts:34](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/actions/src/types.ts#L34)

URL parameters from the route pattern.

***

### request

> **request**: `Request`

Defined in: [packages/actions/src/types.ts:32](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/actions/src/types.ts#L32)

The incoming HTTP request.
