---
editUrl: false
next: false
prev: false
title: "AuthContext"
---

> **AuthContext** = `object`

Defined in: [packages/auth/src/types.ts:34](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L34)

The auth context for a request, which may or may not be authenticated.

When the user is not logged in, `user` is `null` and `grants` contains
only the anonymous role grants. Use [AuthenticatedContext](/api/auth/type-aliases/authenticatedcontext/) when
you need a guaranteed non-null user.

## Properties

### grants

> **grants**: [`Grant`](/api/permissions/type-aliases/grant/)[]

Defined in: [packages/auth/src/types.ts:38](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L38)

Permission grants resolved from the user's roles (or anonymous roles).

***

### user

> **user**: [`AuthUser`](/api/auth/type-aliases/authuser/) \| `null`

Defined in: [packages/auth/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L36)

The current user, or `null` if the request is unauthenticated.
