---
editUrl: false
next: false
prev: false
title: "RouteArgs"
---

> **RouteArgs** = `object`

Defined in: [packages/core/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/core/src/types.ts#L100)

Route handler arguments passed through from React Router loaders and actions.

## Properties

### context

> **context**: `unknown`

Defined in: [packages/core/src/types.ts:106](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/core/src/types.ts#L106)

The React Router context object (contains `cloudflare.env`, etc.).

***

### params

> **params**: `Record`\<`string`, `string` \| `undefined`\>

Defined in: [packages/core/src/types.ts:104](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/core/src/types.ts#L104)

URL route parameters (e.g., `{ postId: "abc" }`).

***

### request

> **request**: `Request`

Defined in: [packages/core/src/types.ts:102](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/core/src/types.ts#L102)

The incoming HTTP request.
