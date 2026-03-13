---
editUrl: false
next: false
prev: false
title: "definePermissions"
---

## Call Signature

> **definePermissions**\<`TRoles`\>(`config`): [`Permissions`](/api/permissions/type-aliases/permissions/)\<`TRoles`\>

Defined in: [packages/permissions/src/define-permissions.ts:56](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/define-permissions.ts#L56)

Creates a permission configuration that can be shared between server-side
enforcement (`@cfast/db`) and client-side introspection (`@cfast/actions`).

Supports two calling styles:
- **Direct:** `definePermissions(config)` when no custom user type is needed.
- **Curried:** `definePermissions<MyUser>()(config)` to get typed `where` clause user parameters.

### Type Parameters

#### TRoles

`TRoles` *extends* readonly `string`[]

### Parameters

#### config

[`PermissionsConfig`](/api/permissions/type-aliases/permissionsconfig/)\<`TRoles`\>

The permissions configuration with roles, grants, and optional hierarchy.

### Returns

[`Permissions`](/api/permissions/type-aliases/permissions/)\<`TRoles`\>

A [Permissions](/api/permissions/type-aliases/permissions/) object containing roles, raw grants, and hierarchy-expanded `resolvedGrants`.

### Example

```typescript
import { definePermissions, grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts, comments } from "./schema";

const permissions = definePermissions({
  roles: ["anonymous", "user", "admin"] as const,
  grants: {
    anonymous: [
      grant("read", posts, { where: (p) => eq(p.published, true) }),
    ],
    user: [
      grant("read", posts),
      grant("create", posts),
      grant("update", posts, { where: (p, u) => eq(p.authorId, u.id) }),
    ],
    admin: [grant("manage", "all")],
  },
});
```

## Call Signature

> **definePermissions**\<`TUser`\>(): \<`TRoles`\>(`config`) => [`Permissions`](/api/permissions/type-aliases/permissions/)\<`TRoles`\>

Defined in: [packages/permissions/src/define-permissions.ts:59](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/define-permissions.ts#L59)

Creates a permission configuration that can be shared between server-side
enforcement (`@cfast/db`) and client-side introspection (`@cfast/actions`).

Supports two calling styles:
- **Direct:** `definePermissions(config)` when no custom user type is needed.
- **Curried:** `definePermissions<MyUser>()(config)` to get typed `where` clause user parameters.

### Type Parameters

#### TUser

`TUser`

### Returns

A [Permissions](/api/permissions/type-aliases/permissions/) object containing roles, raw grants, and hierarchy-expanded `resolvedGrants`.

> \<`TRoles`\>(`config`): [`Permissions`](/api/permissions/type-aliases/permissions/)\<`TRoles`\>

#### Type Parameters

##### TRoles

`TRoles` *extends* readonly `string`[]

#### Parameters

##### config

[`PermissionsConfig`](/api/permissions/type-aliases/permissionsconfig/)\<`TRoles`, `TUser`\>

#### Returns

[`Permissions`](/api/permissions/type-aliases/permissions/)\<`TRoles`\>

### Example

```typescript
import { definePermissions, grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts, comments } from "./schema";

const permissions = definePermissions({
  roles: ["anonymous", "user", "admin"] as const,
  grants: {
    anonymous: [
      grant("read", posts, { where: (p) => eq(p.published, true) }),
    ],
    user: [
      grant("read", posts),
      grant("create", posts),
      grant("update", posts, { where: (p, u) => eq(p.authorId, u.id) }),
    ],
    admin: [grant("manage", "all")],
  },
});
```
