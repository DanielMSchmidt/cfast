---
editUrl: false
next: false
prev: false
title: "PermissionAction"
---

> **PermissionAction** = `"read"` \| `"create"` \| `"update"` \| `"delete"` \| `"manage"`

Defined in: [packages/permissions/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L39)

A permission action: one of the four CRUD operations, or `"manage"` for all.

- `"read"` maps to `SELECT` queries.
- `"create"` maps to `INSERT` statements.
- `"update"` maps to `UPDATE` statements.
- `"delete"` maps to `DELETE` statements.
- `"manage"` is shorthand for granting all four CRUD actions.
