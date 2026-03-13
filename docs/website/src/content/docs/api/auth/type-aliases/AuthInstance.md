---
editUrl: false
next: false
prev: false
title: "AuthInstance"
---

> **AuthInstance** = `object`

Defined in: [packages/auth/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L129)

The initialized auth instance with methods for session management, role assignment,
impersonation, and request handling.

Created by calling the `initAuth()` function returned from [createAuth](/api/auth/functions/createauth/)
with an [AuthEnvConfig](/api/auth/type-aliases/authenvconfig/).

## Properties

### api

> **api**: `unknown`

Defined in: [packages/auth/src/types.ts:188](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L188)

The underlying Better Auth instance, for escape-hatch usage.

***

### createContext()

> **createContext**: (`request`) => `Promise`\<[`AuthContext`](/api/auth/type-aliases/authcontext/)\>

Defined in: [packages/auth/src/types.ts:134](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L134)

Builds an [AuthContext](/api/auth/type-aliases/authcontext/) from the request's session cookie.
Returns a context with `user: null` if the session is invalid or missing.

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<[`AuthContext`](/api/auth/type-aliases/authcontext/)\>

***

### getRoles()

> **getRoles**: (`userId`) => `Promise`\<`string`[]\>

Defined in: [packages/auth/src/types.ts:144](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L144)

Retrieves all roles assigned to a user.

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`string`[]\>

***

### handler()

> **handler**: (`request`) => `Promise`\<`Response`\>

Defined in: [packages/auth/src/types.ts:186](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L186)

Forwards an HTTP request to the Better Auth handler for processing auth API routes.

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### impersonate()

> **impersonate**: (`adminUserId`, `targetUserId`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:171](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L171)

Starts an impersonation session where the admin acts as the target user.
Only users with roles listed in `impersonation.allowedRoles` can impersonate.

#### Parameters

##### adminUserId

`string`

##### targetUserId

`string`

#### Returns

`Promise`\<`void`\>

#### Throws

If the admin user's roles do not permit impersonation.

***

### removeRole()

> **removeRole**: (`userId`, `role`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:164](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L164)

Removes a single role from a user.

#### Parameters

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

***

### requireUser()

> **requireUser**: (`request`) => `Promise`\<[`AuthenticatedContext`](/api/auth/type-aliases/authenticatedcontext/)\>

Defined in: [packages/auth/src/types.ts:142](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L142)

Like [createContext](/api/auth/type-aliases/authinstance/#createcontext), but redirects to the login page
if the user is not authenticated. Sets a `cfast_redirect_to` cookie so the user
returns to the original URL after login.

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<[`AuthenticatedContext`](/api/auth/type-aliases/authenticatedcontext/)\>

#### Throws

A 302 redirect response when the user is not authenticated.

***

### sendMagicLink()

> **sendMagicLink**: (`params`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:179](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L179)

Sends a magic link email to the given address for passwordless authentication.

#### Parameters

##### params

###### callbackURL?

`string`

Override the post-login redirect URL. Defaults to `redirects.afterLogin`.

###### email

`string`

The recipient's email address.

#### Returns

`Promise`\<`void`\>

#### Throws

If the magic link plugin is not configured.

***

### setRole()

> **setRole**: (`userId`, `role`, `caller?`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:149](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L149)

Assigns a single role to a user (additive, does not remove existing roles).
When `caller.callerRoles` is provided, validates against `roleGrants` rules.

#### Parameters

##### userId

`string`

##### role

`string`

##### caller?

###### callerRoles?

`string`[]

#### Returns

`Promise`\<`void`\>

***

### setRoles()

> **setRoles**: (`userId`, `roles`, `caller?`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:158](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L158)

Replaces all of a user's roles with the given set.
When `caller.callerRoles` is provided, validates each role against `roleGrants` rules.

#### Parameters

##### userId

`string`

##### roles

`string`[]

##### caller?

###### callerRoles?

`string`[]

#### Returns

`Promise`\<`void`\>

***

### stopImpersonating()

> **stopImpersonating**: (`adminUserId`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:173](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L173)

Ends all active impersonation sessions for the given admin user.

#### Parameters

##### adminUserId

`string`

#### Returns

`Promise`\<`void`\>
