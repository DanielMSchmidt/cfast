---
editUrl: false
next: false
prev: false
title: "AdminAuthConfig"
---

> **AdminAuthConfig** = `object`

Defined in: [packages/admin/src/types.ts:66](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L66)

Auth adapter interface that bridges your app's authentication to the admin panel.

The admin panel does not depend on `@cfast/auth` directly. Instead, you provide
callback functions that the admin calls for authentication, role management,
and impersonation. This keeps the admin decoupled from any specific auth library.

## Example

```typescript
const auth: AdminAuthConfig = {
  requireUser: async (request) => {
    const session = await getSession(request);
    return { user: session.user, grants: session.grants };
  },
  hasRole: (user, role) => user.roles.includes(role),
  getRoles: (userId) => authInstance.getRoles(userId),
  setRole: (userId, role) => authInstance.setRole(userId, role),
  removeRole: (userId, role) => authInstance.removeRole(userId, role),
  setRoles: (userId, roles) => authInstance.setRoles(userId, roles),
  impersonate: (adminId, targetId, request) =>
    authInstance.impersonate(adminId, targetId, request),
  stopImpersonation: (request) =>
    authInstance.stopImpersonation(request),
};
```

## Properties

### getRoles()

> **getRoles**: (`userId`) => `Promise`\<`string`[]\>

Defined in: [packages/admin/src/types.ts:74](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L74)

Fetches all roles assigned to a user by ID. Used in user management views.

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`string`[]\>

***

### hasRole()

> **hasRole**: (`user`, `role`) => `boolean`

Defined in: [packages/admin/src/types.ts:72](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L72)

Checks whether the given user has a specific role. Used for the admin access guard.

#### Parameters

##### user

[`AdminUser`](/api/admin/type-aliases/adminuser/)

##### role

`string`

#### Returns

`boolean`

***

### impersonate()

> **impersonate**: (`adminId`, `targetId`, `request`) => `Promise`\<`Response`\>

Defined in: [packages/admin/src/types.ts:82](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L82)

Starts an impersonation session. Should return a redirect `Response` that sets the impersonation cookie/session.

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

Defined in: [packages/admin/src/types.ts:78](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L78)

Removes a single role from a user. Called from the user detail role management UI.

#### Parameters

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

***

### requireUser()

> **requireUser**: (`request`) => `Promise`\<\{ `grants`: `unknown`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); \}\>

Defined in: [packages/admin/src/types.ts:68](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L68)

Extracts the authenticated user and their permission grants from the request. Throws or redirects if unauthenticated.

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<\{ `grants`: `unknown`[]; `user`: [`AdminUser`](/api/admin/type-aliases/adminuser/); \}\>

***

### setRole()

> **setRole**: (`userId`, `role`) => `Promise`\<`void`\>

Defined in: [packages/admin/src/types.ts:76](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L76)

Assigns a single role to a user. Called from the user detail role management UI.

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

Defined in: [packages/admin/src/types.ts:80](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L80)

Replaces all roles for a user with the given set. Used for bulk role assignment.

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

Defined in: [packages/admin/src/types.ts:88](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/types.ts#L88)

Ends the current impersonation session. Should return a redirect `Response` that restores the admin session.

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>
