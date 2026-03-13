---
editUrl: false
next: false
prev: false
title: "RouteArgs"
---

> **RouteArgs** = `object`

Defined in: [packages/core/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L100)

Route handler arguments passed through from React Router loaders and actions.

## Properties

### context

> **context**: `unknown`

Defined in: [packages/core/src/types.ts:106](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L106)

The React Router context object (contains `cloudflare.env`, etc.).

***

### params

> **params**: `Record`\<`string`, `string` \| `undefined`\>

Defined in: [packages/core/src/types.ts:104](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L104)

URL route parameters (e.g., `{ postId: "abc" }`).

***

### request

> **request**: `Request`

Defined in: [packages/core/src/types.ts:102](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/types.ts#L102)

The incoming HTTP request.
