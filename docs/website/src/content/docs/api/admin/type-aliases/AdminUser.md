---
editUrl: false
next: false
prev: false
title: "AdminUser"
---

> **AdminUser** = `object`

Defined in: [packages/admin/src/types.ts:23](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L23)

A user representation for the admin panel, decoupled from `@cfast/auth`.

This is the shape the admin expects from your auth adapter. It includes
impersonation state so the admin UI can display banners and restore the
real admin session.

## Example

```typescript
const adminUser: AdminUser = {
  id: "usr_123",
  email: "admin@example.com",
  name: "Jane Admin",
  avatarUrl: null,
  roles: ["admin"],
};
```

## Properties

### avatarUrl

> **avatarUrl**: `string` \| `null`

Defined in: [packages/admin/src/types.ts:31](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L31)

URL to the user's avatar image, or `null` if none is set.

***

### email

> **email**: `string`

Defined in: [packages/admin/src/types.ts:27](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L27)

The user's email address, displayed in the admin sidebar and user views.

***

### id

> **id**: `string`

Defined in: [packages/admin/src/types.ts:25](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L25)

Unique user identifier (typically from the `user` table primary key).

***

### isImpersonating?

> `optional` **isImpersonating**: `boolean`

Defined in: [packages/admin/src/types.ts:35](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L35)

Whether this session is an impersonation session started by another admin.

***

### name

> **name**: `string`

Defined in: [packages/admin/src/types.ts:29](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L29)

Display name shown in the admin header and user management views.

***

### realUser?

> `optional` **realUser**: `object`

Defined in: [packages/admin/src/types.ts:37](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L37)

The real admin user behind an impersonation session. Present only when [isImpersonating](/api/admin/type-aliases/adminuser/#isimpersonating) is `true`.

#### id

> **id**: `string`

#### name

> **name**: `string`

***

### roles

> **roles**: `string`[]

Defined in: [packages/admin/src/types.ts:33](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/types.ts#L33)

List of role names assigned to this user (e.g., `["admin", "editor"]`).
