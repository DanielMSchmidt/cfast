---
editUrl: false
next: false
prev: false
title: "AuthInstance"
---

> **AuthInstance** = `object`

Defined in: [packages/auth/src/types.ts:49](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L49)

## Properties

### api

> **api**: `unknown`

Defined in: [packages/auth/src/types.ts:74](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L74)

The underlying Better Auth instance

***

### createContext()

> **createContext**: (`request`) => `Promise`\<[`AuthContext`](/api/auth/src/type-aliases/authcontext/)\>

Defined in: [packages/auth/src/types.ts:50](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L50)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<[`AuthContext`](/api/auth/src/type-aliases/authcontext/)\>

***

### getRoles()

> **getRoles**: (`userId`) => `Promise`\<`string`[]\>

Defined in: [packages/auth/src/types.ts:52](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L52)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`string`[]\>

***

### handler()

> **handler**: (`request`) => `Promise`\<`Response`\>

Defined in: [packages/auth/src/types.ts:72](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L72)

Handle auth API requests (forwards to Better Auth)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### impersonate()

> **impersonate**: (`adminUserId`, `targetUserId`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:64](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L64)

#### Parameters

##### adminUserId

`string`

##### targetUserId

`string`

#### Returns

`Promise`\<`void`\>

***

### removeRole()

> **removeRole**: (`userId`, `role`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:63](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L63)

#### Parameters

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

***

### requireUser()

> **requireUser**: (`request`) => `Promise`\<[`AuthenticatedContext`](/api/auth/src/type-aliases/authenticatedcontext/)\>

Defined in: [packages/auth/src/types.ts:51](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L51)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<[`AuthenticatedContext`](/api/auth/src/type-aliases/authenticatedcontext/)\>

***

### sendMagicLink()

> **sendMagicLink**: (`params`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:67](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L67)

Send a magic link email to the given address

#### Parameters

##### params

###### callbackURL?

`string`

###### email

`string`

#### Returns

`Promise`\<`void`\>

***

### setRole()

> **setRole**: (`userId`, `role`, `caller?`) => `Promise`\<`void`\>

Defined in: [packages/auth/src/types.ts:53](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L53)

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

Defined in: [packages/auth/src/types.ts:58](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L58)

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

Defined in: [packages/auth/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/types.ts#L65)

#### Parameters

##### adminUserId

`string`

#### Returns

`Promise`\<`void`\>
