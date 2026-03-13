---
editUrl: false
next: false
prev: false
title: "AuthEnvConfig"
---

> **AuthEnvConfig** = `object`

Defined in: [packages/auth/src/types.ts:115](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L115)

Per-request environment bindings required to initialize an [AuthInstance](/api/auth/type-aliases/authinstance/).

Passed to the `initAuth()` function returned by [createAuth](/api/auth/functions/createauth/).

## Properties

### appUrl

> **appUrl**: `string`

Defined in: [packages/auth/src/types.ts:119](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L119)

The application's public URL, used as the base URL for Better Auth endpoints.

***

### d1

> **d1**: `D1Database`

Defined in: [packages/auth/src/types.ts:117](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L117)

The Cloudflare D1 database binding for session and user storage.
