---
editUrl: false
next: false
prev: false
title: "AdminAuthConfig"
---

> **AdminAuthConfig** = `object`

Defined in: [packages/admin/src/types.ts:19](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L19)

## Properties

### getRoles()

> **getRoles**: (`userId`) => `Promise`\<`string`[]\>

Defined in: [packages/admin/src/types.ts:24](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L24)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`string`[]\>

***

### hasRole()

> **hasRole**: (`user`, `role`) => `boolean`

Defined in: [packages/admin/src/types.ts:23](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L23)

#### Parameters

##### user

[`AdminUser`](/api/admin/src/type-aliases/adminuser/)

##### role

`string`

#### Returns

`boolean`

***

### impersonate()

> **impersonate**: (`adminId`, `targetId`, `request`) => `Promise`\<`Response`\>

Defined in: [packages/admin/src/types.ts:28](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L28)

#### Parameters

##### adminId

`string`

##### targetId

`string`

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### removeRole()

> **removeRole**: (`userId`, `role`) => `Promise`\<`void`\>

Defined in: [packages/admin/src/types.ts:26](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L26)

#### Parameters

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

***

### requireUser()

> **requireUser**: (`request`) => `Promise`\<\{ `grants`: `unknown`[]; `user`: [`AdminUser`](/api/admin/src/type-aliases/adminuser/); \}\>

Defined in: [packages/admin/src/types.ts:20](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L20)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<\{ `grants`: `unknown`[]; `user`: [`AdminUser`](/api/admin/src/type-aliases/adminuser/); \}\>

***

### setRole()

> **setRole**: (`userId`, `role`) => `Promise`\<`void`\>

Defined in: [packages/admin/src/types.ts:25](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L25)

#### Parameters

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

***

### setRoles()

> **setRoles**: (`userId`, `roles`) => `Promise`\<`void`\>

Defined in: [packages/admin/src/types.ts:27](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L27)

#### Parameters

##### userId

`string`

##### roles

`string`[]

#### Returns

`Promise`\<`void`\>

***

### stopImpersonation()

> **stopImpersonation**: (`request`) => `Promise`\<`Response`\>

Defined in: [packages/admin/src/types.ts:33](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/types.ts#L33)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>
