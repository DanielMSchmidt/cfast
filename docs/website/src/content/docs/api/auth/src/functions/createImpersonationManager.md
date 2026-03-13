---
editUrl: false
next: false
prev: false
title: "createImpersonationManager"
---

> **createImpersonationManager**(`d1`, `options?`): `object`

Defined in: [packages/auth/src/impersonation.ts:7](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/auth/src/impersonation.ts#L7)

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
