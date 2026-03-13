---
editUrl: false
next: false
prev: false
title: "CrudAction"
---

> **CrudAction** = `Exclude`\<[`PermissionAction`](/api/permissions/type-aliases/permissionaction/), `"manage"`\>

Defined in: [packages/permissions/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L47)

A CRUD-only permission action (excludes `"manage"`).

Useful when you need to iterate over concrete operations without the
`"manage"` shorthand. See also [CRUD\_ACTIONS](/api/permissions/variables/crud_actions/).
