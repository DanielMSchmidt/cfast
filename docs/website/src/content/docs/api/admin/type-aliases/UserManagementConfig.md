---
editUrl: false
next: false
prev: false
title: "UserManagementConfig"
---

> **UserManagementConfig** = `object`

Defined in: [packages/admin/src/types.ts:213](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L213)

Configuration for the built-in user management views.

Controls which roles can be assigned through the admin UI. Role assignment
respects your auth adapter's `setRole` and `removeRole` callbacks.

## Example

```typescript
const users: UserManagementConfig = {
  assignableRoles: ["user", "editor", "moderator", "admin"],
};
```

## Properties

### assignableRoles?

> `optional` **assignableRoles**: `string`[]

Defined in: [packages/admin/src/types.ts:215](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L215)

The list of role names that can be assigned/removed via the admin user management UI. Defaults to an empty array (no role management).
