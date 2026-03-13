---
editUrl: false
next: false
prev: false
title: "RequestArgs"
---

> **RequestArgs** = `object`

Defined in: [packages/actions/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L50)

Subset of React Router loader/action arguments consumed by `@cfast/actions`.

Mirrors the shape React Router passes to `loader` and `action` exports,
trimmed to only the fields the actions system needs.

## Properties

### context?

> `optional` **context**: `unknown`

Defined in: [packages/actions/src/types.ts:56](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L56)

Optional context object (e.g., Cloudflare Workers env via `context.cloudflare.env`).

***

### params

> **params**: `Record`\<`string`, `string` \| `undefined`\>

Defined in: [packages/actions/src/types.ts:54](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L54)

URL parameters from the route pattern (e.g., `{ postId: "abc" }`).

***

### request

> **request**: `Request`

Defined in: [packages/actions/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L52)

The incoming HTTP request.
