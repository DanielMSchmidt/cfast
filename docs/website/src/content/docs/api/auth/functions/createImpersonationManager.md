---
editUrl: false
next: false
prev: false
title: "createImpersonationManager"
---

> **createImpersonationManager**(`d1`, `options?`): `object`

Defined in: [packages/auth/src/impersonation.ts:41](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/auth/src/impersonation.ts#L41)

Creates an impersonation manager backed by a Cloudflare D1 database.

Manages an audit trail of impersonation sessions, allowing admins to
temporarily act as another user for debugging and support. Each session
is logged with start and end timestamps.

## Parameters

### d1

`D1Database`

The Cloudflare D1 database binding.

### options?

`ImpersonationManagerOptions`

Optional configuration for table and column names.

## Returns

`object`

An object with `impersonate`, `stopImpersonating`, and `getActiveImpersonation` methods.

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

## Example

```ts
import { createImpersonationManager } from "@cfast/auth";

const impersonation = createImpersonationManager(env.DB);

// Start impersonating a user
await impersonation.impersonate(adminUserId, targetUserId);

// Check if admin is currently impersonating someone
const active = await impersonation.getActiveImpersonation(adminUserId);
// active?.targetUserId

// Stop impersonating
await impersonation.stopImpersonating(adminUserId);
```
