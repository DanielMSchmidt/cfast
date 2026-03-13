---
editUrl: false
next: false
prev: false
title: "AdminConfig"
---

> **AdminConfig** = `object`

Defined in: [packages/admin/src/types.ts:90](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L90)

## Properties

### auth

> **auth**: [`AdminAuthConfig`](/api/admin/src/type-aliases/adminauthconfig/)

Defined in: [packages/admin/src/types.ts:92](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L92)

***

### dashboard?

> `optional` **dashboard**: [`DashboardConfig`](/api/admin/src/type-aliases/dashboardconfig/)

Defined in: [packages/admin/src/types.ts:96](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L96)

***

### db

> **db**: [`CreateDbFn`](/api/admin/src/type-aliases/createdbfn/)

Defined in: [packages/admin/src/types.ts:91](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L91)

***

### requiredRole?

> `optional` **requiredRole**: `string`

Defined in: [packages/admin/src/types.ts:97](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L97)

***

### schema

> **schema**: `Record`\<`string`, `SQLiteTable`\>

Defined in: [packages/admin/src/types.ts:93](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L93)

***

### tables?

> `optional` **tables**: `Record`\<`string`, [`TableOverrides`](/api/admin/src/type-aliases/tableoverrides/)\>

Defined in: [packages/admin/src/types.ts:94](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L94)

***

### users?

> `optional` **users**: [`UserManagementConfig`](/api/admin/src/type-aliases/usermanagementconfig/)

Defined in: [packages/admin/src/types.ts:95](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/types.ts#L95)
