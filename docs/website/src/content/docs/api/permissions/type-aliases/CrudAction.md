---
editUrl: false
next: false
prev: false
title: "CrudAction"
---

> **CrudAction** = `Exclude`\<[`PermissionAction`](/api/permissions/type-aliases/permissionaction/), `"manage"`\>

Defined in: [packages/permissions/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L47)

A CRUD-only permission action (excludes `"manage"`).

Useful when you need to iterate over concrete operations without the
`"manage"` shorthand. See also [CRUD\_ACTIONS](/api/permissions/variables/crud_actions/).
