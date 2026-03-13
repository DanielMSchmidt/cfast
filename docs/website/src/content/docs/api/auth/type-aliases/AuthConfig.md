---
editUrl: false
next: false
prev: false
title: "AuthConfig"
---

> **AuthConfig** = `object`

Defined in: [packages/auth/src/types.ts:61](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L61)

Configuration for [createAuth](/api/auth/functions/createauth/).

Defines authentication methods, session behavior, role management rules,
and integration with `@cfast/permissions`.

## Properties

### anonymousRoles?

> `optional` **anonymousRoles**: `string`[]

Defined in: [packages/auth/src/types.ts:91](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L91)

Roles assigned to unauthenticated (anonymous) requests for permission resolution.

***

### defaultRoles?

> `optional` **defaultRoles**: `string`[]

Defined in: [packages/auth/src/types.ts:93](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L93)

Default roles assigned to authenticated users who have no explicit role assignments. Defaults to `["reader"]`.

***

### impersonation?

> `optional` **impersonation**: `object`

Defined in: [packages/auth/src/types.ts:99](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L99)

Impersonation feature configuration.

#### allowedRoles?

> `optional` **allowedRoles**: `string`[]

Roles permitted to impersonate other users. Defaults to `["admin"]`.

***

### magicLink?

> `optional` **magicLink**: `object`

Defined in: [packages/auth/src/types.ts:74](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L74)

Magic link email configuration. Required to enable magic link authentication.

#### sendMagicLink()

> **sendMagicLink**: (`params`) => `Promise`\<`void`\>

Callback to send the magic link email. Receives the user's email and the login URL.

##### Parameters

###### params

###### email

`string`

###### url

`string`

##### Returns

`Promise`\<`void`\>

***

### passkeys?

> `optional` **passkeys**: `object`

Defined in: [packages/auth/src/types.ts:67](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L67)

WebAuthn passkey configuration. Required to enable passkey authentication.

#### rpId

> **rpId**: `string`

Relying party identifier, typically the app's domain (e.g., `"myapp.com"`).

#### rpName

> **rpName**: `string`

Relying party display name shown during WebAuthn registration.

***

### permissions

> **permissions**: [`Permissions`](/api/permissions/type-aliases/permissions/)

Defined in: [packages/auth/src/types.ts:63](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L63)

The permissions config from `definePermissions()`. Roles are inferred from this.

***

### redirects?

> `optional` **redirects**: `object`

Defined in: [packages/auth/src/types.ts:84](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L84)

Redirect paths for the authentication flow.

#### afterLogin?

> `optional` **afterLogin**: `string`

Where to redirect after successful login. Defaults to `"/"`.

#### loginPath?

> `optional` **loginPath**: `string`

Where to send unauthenticated users. Defaults to `"/login"`.

***

### roleGrants?

> `optional` **roleGrants**: `Record`\<`string`, `string`[]\>

Defined in: [packages/auth/src/types.ts:97](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L97)

Maps each role to the set of roles it is allowed to assign. Controls who can promote whom.

***

### roleTableName?

> `optional` **roleTableName**: `string`

Defined in: [packages/auth/src/types.ts:95](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L95)

Custom table name for storing role assignments. Defaults to `"roles"`.

***

### schema?

> `optional` **schema**: `Record`\<`string`, `unknown`\>

Defined in: [packages/auth/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L65)

Optional Drizzle schema override for the Better Auth database adapter.

***

### session?

> `optional` **session**: `object`

Defined in: [packages/auth/src/types.ts:79](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L79)

Session lifetime configuration.

#### expiresIn?

> `optional` **expiresIn**: `string`

How long sessions last before expiring (e.g., `"30d"`, `"12h"`, `"60m"`). Defaults to `"30d"`.

***

### templates?

> `optional` **templates**: `object`

Defined in: [packages/auth/src/types.ts:104](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/types.ts#L104)

Custom email template functions.

#### magicLink()?

> `optional` **magicLink**: (`props`) => `string`

Returns an HTML string for the magic link email. Receives the login URL and recipient email.

##### Parameters

###### props

###### email

`string`

###### url

`string`

##### Returns

`string`
