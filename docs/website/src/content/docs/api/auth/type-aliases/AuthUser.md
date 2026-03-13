---
editUrl: false
next: false
prev: false
title: "AuthUser"
---

> **AuthUser** = `object`

Defined in: [packages/auth/src/types.ts:10](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L10)

The authenticated user object available throughout the application.

Contains identity fields, assigned roles, and optional impersonation state.
This is the user shape returned by [AuthContext](/api/auth/type-aliases/authcontext/) and [AuthenticatedContext](/api/auth/type-aliases/authenticatedcontext/),
and is the same object passed to `createDb({ user })` for permission resolution.

## Properties

### avatarUrl

> **avatarUrl**: `string` \| `null`

Defined in: [packages/auth/src/types.ts:18](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L18)

URL to the user's avatar image, or `null` if not set.

***

### email

> **email**: `string`

Defined in: [packages/auth/src/types.ts:14](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L14)

The user's email address, used for magic link authentication.

***

### id

> **id**: `string`

Defined in: [packages/auth/src/types.ts:12](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L12)

Unique user identifier (UUID from Better Auth).

***

### isImpersonating?

> `optional` **isImpersonating**: `boolean`

Defined in: [packages/auth/src/types.ts:22](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L22)

Whether an admin is currently impersonating this user.

***

### name

> **name**: `string`

Defined in: [packages/auth/src/types.ts:16](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L16)

Display name for the user.

***

### realUser?

> `optional` **realUser**: `object`

Defined in: [packages/auth/src/types.ts:24](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L24)

The real admin user performing the impersonation, if active.

#### id

> **id**: `string`

#### name

> **name**: `string`

***

### roles

> **roles**: `string`[]

Defined in: [packages/auth/src/types.ts:20](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/types.ts#L20)

Roles assigned to this user, matching role names from `@cfast/permissions`.
