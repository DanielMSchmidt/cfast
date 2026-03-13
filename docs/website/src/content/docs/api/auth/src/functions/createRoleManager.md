---
editUrl: false
next: false
prev: false
title: "createRoleManager"
---

> **createRoleManager**(`d1`, `options?`): `object`

Defined in: [packages/auth/src/roles.ts:27](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/roles.ts#L27)

## Parameters

### d1

`D1Database`

### options?

`RoleManagerOptions`

## Returns

`object`

### getRoles()

> **getRoles**(`userId`): `Promise`\<`string`[]\>

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`string`[]\>

### removeRole()

> **removeRole**(`userId`, `role`): `Promise`\<`void`\>

#### Parameters

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

### setRole()

> **setRole**(`userId`, `role`, `caller?`): `Promise`\<`void`\>

#### Parameters

##### userId

`string`

##### role

`string`

##### caller?

`CallerOptions`

#### Returns

`Promise`\<`void`\>

### setRoles()

> **setRoles**(`userId`, `roles`, `caller?`): `Promise`\<`void`\>

#### Parameters

##### userId

`string`

##### roles

`string`[]

##### caller?

`CallerOptions`

#### Returns

`Promise`\<`void`\>
