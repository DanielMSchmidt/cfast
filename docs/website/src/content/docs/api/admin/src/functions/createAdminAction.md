---
editUrl: false
next: false
prev: false
title: "createAdminAction"
---

> **createAdminAction**(`config`, `tableMetas`): (`request`) => `Promise`\<`Response` \| [`AdminActionResult`](/api/admin/src/type-aliases/adminactionresult/)\>

Defined in: [packages/admin/src/action.ts:103](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/admin/src/action.ts#L103)

Create an admin action function from config and introspected table metadata.

The returned action:
1. Guards access with auth + role check
2. Reads `_action` from formData to determine the operation
3. Dispatches to the appropriate handler
4. Returns AdminActionResult or a Response (for impersonation)

## Parameters

### config

[`AdminConfig`](/api/admin/src/type-aliases/adminconfig/)

### tableMetas

[`AdminTableMeta`](/api/admin/src/type-aliases/admintablemeta/)[]

## Returns

> (`request`): `Promise`\<`Response` \| [`AdminActionResult`](/api/admin/src/type-aliases/adminactionresult/)\>

### Parameters

#### request

`Request`

### Returns

`Promise`\<`Response` \| [`AdminActionResult`](/api/admin/src/type-aliases/adminactionresult/)\>
