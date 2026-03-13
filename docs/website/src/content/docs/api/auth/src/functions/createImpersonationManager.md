---
editUrl: false
next: false
prev: false
title: "createImpersonationManager"
---

> **createImpersonationManager**(`d1`, `options?`): `object`

Defined in: [packages/auth/src/impersonation.ts:7](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/auth/src/impersonation.ts#L7)

## Parameters

### d1

`D1Database`

### options?

`ImpersonationManagerOptions`

## Returns

`object`

### getActiveImpersonation()

> **getActiveImpersonation**(`adminUserId`): `Promise`\<\{ `targetUserId`: `string`; \} \| `null`\>

#### Parameters

##### adminUserId

`string`

#### Returns

`Promise`\<\{ `targetUserId`: `string`; \} \| `null`\>

### impersonate()

> **impersonate**(`adminUserId`, `targetUserId`): `Promise`\<`void`\>

#### Parameters

##### adminUserId

`string`

##### targetUserId

`string`

#### Returns

`Promise`\<`void`\>

### stopImpersonating()

> **stopImpersonating**(`adminUserId`): `Promise`\<`void`\>

#### Parameters

##### adminUserId

`string`

#### Returns

`Promise`\<`void`\>
