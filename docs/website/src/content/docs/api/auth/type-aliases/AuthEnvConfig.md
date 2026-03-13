---
editUrl: false
next: false
prev: false
title: "AuthEnvConfig"
---

> **AuthEnvConfig** = `object`

Defined in: [packages/auth/src/types.ts:115](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L115)

Per-request environment bindings required to initialize an [AuthInstance](/api/auth/type-aliases/authinstance/).

Passed to the `initAuth()` function returned by [createAuth](/api/auth/functions/createauth/).

## Properties

### appUrl

> **appUrl**: `string`

Defined in: [packages/auth/src/types.ts:119](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L119)

The application's public URL, used as the base URL for Better Auth endpoints.

***

### d1

> **d1**: `D1Database`

Defined in: [packages/auth/src/types.ts:117](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L117)

The Cloudflare D1 database binding for session and user storage.
