---
editUrl: false
next: false
prev: false
title: "createRoleManager"
---

> **createRoleManager**(`d1`, `options?`): `object`

Defined in: [packages/auth/src/roles.ts:68](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/auth/src/roles.ts#L68)

Creates a role manager backed by a Cloudflare D1 database.

Provides methods to query, assign, replace, and remove user roles.
When `roleGrants` is configured, assignment methods enforce authorization
rules so that, for example, an editor cannot promote someone to admin.

## Parameters

### d1

`D1Database`

The Cloudflare D1 database binding.

### options?

`RoleManagerOptions`

Optional configuration for table name and role grant rules.

## Returns

`object`

An object with `getRoles`, `setRole`, `setRoles`, and `removeRole` methods.

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

## Example

```ts
import { createRoleManager } from "@cfast/auth";

const roles = createRoleManager(env.DB, {
  roleGrants: {
    admin: ["admin", "editor", "user"],
    editor: ["user"],
  },
});

const userRoles = await roles.getRoles(userId);
await roles.setRole(userId, "editor", { callerRoles: ["admin"] });
```
