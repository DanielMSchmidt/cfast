---
editUrl: false
next: false
prev: false
title: "AuthenticatedContext"
---

> **AuthenticatedContext** = `object`

Defined in: [packages/auth/src/types.ts:48](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L48)

A narrowed [AuthContext](/api/auth/type-aliases/authcontext/) where the user is guaranteed to be present.

Returned by `auth.requireUser()`, which redirects to the login page if
the request is unauthenticated. Use this in loaders and actions that
require a logged-in user.

## Properties

### grants

> **grants**: [`Grant`](/api/permissions/type-aliases/grant/)[]

Defined in: [packages/auth/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L52)

Permission grants resolved from the user's assigned roles.

***

### user

> **user**: [`AuthUser`](/api/auth/type-aliases/authuser/)

Defined in: [packages/auth/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L50)

The authenticated user (always present).
