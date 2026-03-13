---
editUrl: false
next: false
prev: false
title: "createAdminComponent"
---

> **createAdminComponent**(`tableMetas`): () => `ReactElement`

Defined in: [packages/admin/src/components/admin-root.tsx:22](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/components/admin-root.tsx#L22)

Create the root admin React component.

Takes table metadata (from introspection) so it can pass drizzle table
references to forms and find primary key information.

## Parameters

### tableMetas

[`AdminTableMeta`](/api/admin/src/type-aliases/admintablemeta/)[]

## Returns

> (): `ReactElement`

### Returns

`ReactElement`
