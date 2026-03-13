---
editUrl: false
next: false
prev: false
title: "RouteArgs"
---

> **RouteArgs** = `object`

Defined in: [packages/core/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L100)

Route handler arguments passed through from React Router loaders and actions.

## Properties

### context

> **context**: `unknown`

Defined in: [packages/core/src/types.ts:106](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L106)

The React Router context object (contains `cloudflare.env`, etc.).

***

### params

> **params**: `Record`\<`string`, `string` \| `undefined`\>

Defined in: [packages/core/src/types.ts:104](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L104)

URL route parameters (e.g., `{ postId: "abc" }`).

***

### request

> **request**: `Request`

Defined in: [packages/core/src/types.ts:102](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L102)

The incoming HTTP request.
