---
editUrl: false
next: false
prev: false
title: "PermissionAction"
---

> **PermissionAction** = `"read"` \| `"create"` \| `"update"` \| `"delete"` \| `"manage"`

Defined in: [packages/permissions/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L39)

A permission action: one of the four CRUD operations, or `"manage"` for all.

- `"read"` maps to `SELECT` queries.
- `"create"` maps to `INSERT` statements.
- `"update"` maps to `UPDATE` statements.
- `"delete"` maps to `DELETE` statements.
- `"manage"` is shorthand for granting all four CRUD actions.
