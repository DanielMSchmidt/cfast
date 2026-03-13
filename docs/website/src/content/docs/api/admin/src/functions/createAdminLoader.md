---
editUrl: false
next: false
prev: false
title: "createAdminLoader"
---

> **createAdminLoader**(`config`, `tableMetas`): (`request`) => `Promise`\<[`AdminLoaderData`](/api/admin/src/type-aliases/adminloaderdata/)\>

Defined in: [packages/admin/src/loader.ts:556](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/loader.ts#L556)

Create an admin loader function from config and introspected table metadata.

The returned loader:
1. Guards access with auth + role check
2. Parses URL params to determine the view
3. Fetches appropriate data and returns AdminLoaderData

## Parameters

### config

[`AdminConfig`](/api/admin/src/type-aliases/adminconfig/)

### tableMetas

[`AdminTableMeta`](/api/admin/src/type-aliases/admintablemeta/)[]

## Returns

> (`request`): `Promise`\<[`AdminLoaderData`](/api/admin/src/type-aliases/adminloaderdata/)\>

### Parameters

#### request

`Request`

### Returns

`Promise`\<[`AdminLoaderData`](/api/admin/src/type-aliases/adminloaderdata/)\>
