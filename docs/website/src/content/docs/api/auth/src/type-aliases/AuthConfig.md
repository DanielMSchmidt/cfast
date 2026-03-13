---
editUrl: false
next: false
prev: false
title: "AuthConfig"
---

> **AuthConfig** = `object`

Defined in: [packages/auth/src/types.ts:23](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L23)

## Properties

### anonymousRoles?

> `optional` **anonymousRoles**: `string`[]

Defined in: [packages/auth/src/types.ts:32](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L32)

***

### defaultRoles?

> `optional` **defaultRoles**: `string`[]

Defined in: [packages/auth/src/types.ts:33](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L33)

***

### impersonation?

> `optional` **impersonation**: `object`

Defined in: [packages/auth/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L36)

#### allowedRoles?

> `optional` **allowedRoles**: `string`[]

***

### magicLink?

> `optional` **magicLink**: `object`

Defined in: [packages/auth/src/types.ts:27](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L27)

#### sendMagicLink()

> **sendMagicLink**: (`params`) => `Promise`\<`void`\>

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

Defined in: [packages/auth/src/types.ts:26](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L26)

#### rpId

> **rpId**: `string`

#### rpName

> **rpName**: `string`

***

### permissions

> **permissions**: [`Permissions`](/api/permissions/src/type-aliases/permissions/)

Defined in: [packages/auth/src/types.ts:24](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L24)

***

### redirects?

> `optional` **redirects**: `object`

Defined in: [packages/auth/src/types.ts:31](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L31)

#### afterLogin?

> `optional` **afterLogin**: `string`

#### loginPath?

> `optional` **loginPath**: `string`

***

### roleGrants?

> `optional` **roleGrants**: `Record`\<`string`, `string`[]\>

Defined in: [packages/auth/src/types.ts:35](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L35)

***

### roleTableName?

> `optional` **roleTableName**: `string`

Defined in: [packages/auth/src/types.ts:34](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L34)

***

### schema?

> `optional` **schema**: `Record`\<`string`, `unknown`\>

Defined in: [packages/auth/src/types.ts:25](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L25)

***

### session?

> `optional` **session**: `object`

Defined in: [packages/auth/src/types.ts:30](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L30)

#### expiresIn?

> `optional` **expiresIn**: `string`

***

### templates?

> `optional` **templates**: `object`

Defined in: [packages/auth/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/types.ts#L39)

#### magicLink()?

> `optional` **magicLink**: (`props`) => `string`

##### Parameters

###### props

###### email

`string`

###### url

`string`

##### Returns

`string`
