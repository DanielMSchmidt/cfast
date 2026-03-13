---
editUrl: false
next: false
prev: false
title: "AdminConfig"
---

> **AdminConfig** = `object`

Defined in: [packages/admin/src/types.ts:298](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L298)

Top-level configuration for [createAdmin](/api/admin/functions/createadmin/).

Combines the database factory, auth adapter, Drizzle schema, and optional
customizations for tables, user management, and the dashboard.

## Example

```typescript
const admin = createAdmin({
  db: (grants, user) => createDb({ d1: env.DB, schema, grants, user }),
  auth,
  schema,
  requiredRole: "admin",
  tables: { posts: { label: "Blog Posts" } },
  users: { assignableRoles: ["user", "editor", "admin"] },
  dashboard: {
    widgets: [{ type: "count", table: "users", label: "Total Users" }],
  },
});
```

## Properties

### auth

> **auth**: [`AdminAuthConfig`](/api/admin/type-aliases/adminauthconfig/)

Defined in: [packages/admin/src/types.ts:302](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L302)

Auth adapter that provides user authentication, role management, and impersonation. See [AdminAuthConfig](/api/admin/type-aliases/adminauthconfig/).

***

### dashboard?

> `optional` **dashboard**: [`DashboardConfig`](/api/admin/type-aliases/dashboardconfig/)

Defined in: [packages/admin/src/types.ts:310](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L310)

Configuration for the admin dashboard index page. See [DashboardConfig](/api/admin/type-aliases/dashboardconfig/).

***

### db

> **db**: [`CreateDbFn`](/api/admin/type-aliases/createdbfn/)

Defined in: [packages/admin/src/types.ts:300](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L300)

Factory function that creates a permission-scoped DB instance per request. See [CreateDbFn](/api/admin/type-aliases/createdbfn/).

***

### requiredRole?

> `optional` **requiredRole**: `string`

Defined in: [packages/admin/src/types.ts:312](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L312)

Role required to access the admin panel. Defaults to `"admin"`.

***

### schema

> **schema**: `Record`\<`string`, `SQLiteTable`\>

Defined in: [packages/admin/src/types.ts:304](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L304)

Your Drizzle schema object (e.g., `import * as schema from "~/schema"`). Tables are introspected from this.

***

### tables?

> `optional` **tables**: `Record`\<`string`, [`TableOverrides`](/api/admin/type-aliases/tableoverrides/)\>

Defined in: [packages/admin/src/types.ts:306](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L306)

Per-table display and behavior overrides, keyed by table name. See [TableOverrides](/api/admin/type-aliases/tableoverrides/).

***

### users?

> `optional` **users**: [`UserManagementConfig`](/api/admin/type-aliases/usermanagementconfig/)

Defined in: [packages/admin/src/types.ts:308](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/types.ts#L308)

Configuration for the built-in user management views. See [UserManagementConfig](/api/admin/type-aliases/usermanagementconfig/).
