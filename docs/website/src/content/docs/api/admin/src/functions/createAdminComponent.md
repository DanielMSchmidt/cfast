---
editUrl: false
next: false
prev: false
title: "createAdminComponent"
---

> **createAdminComponent**(`tableMetas`): () => `ReactElement`

Defined in: [packages/admin/src/components/admin-root.tsx:22](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/admin/src/components/admin-root.tsx#L22)

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
