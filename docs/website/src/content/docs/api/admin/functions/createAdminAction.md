---
editUrl: false
next: false
prev: false
title: "createAdminAction"
---

> **createAdminAction**(`config`, `tableMetas`): (`request`) => `Promise`\<`Response` \| [`AdminActionResult`](/api/admin/type-aliases/adminactionresult/)\>

Defined in: [packages/admin/src/action.ts:121](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/action.ts#L121)

Create an admin action function from config and introspected table metadata.

The returned action handles all admin mutations: record create, update, delete,
role assignment/removal, impersonation start/stop, and custom row actions.
It reads the `_action` field from the submitted `FormData` to dispatch to the
appropriate handler.

Like the loader, it guards access using the auth adapter and creates a
permission-scoped DB instance per request.

Use this instead of [createAdmin](/api/admin/functions/createadmin/) when you need server/client code splitting.

## Parameters

### config

[`AdminConfig`](/api/admin/type-aliases/adminconfig/)

The admin configuration (same object passed to [createAdmin](/api/admin/functions/createadmin/)).

### tableMetas

[`AdminTableMeta`](/api/admin/type-aliases/admintablemeta/)[]

Table metadata from [introspectSchema](/api/admin/functions/introspectschema/).

## Returns

An async function that takes a `Request` and returns an [AdminActionResult](/api/admin/type-aliases/adminactionresult/) or a `Response` (for impersonation redirects).

> (`request`): `Promise`\<`Response` \| [`AdminActionResult`](/api/admin/type-aliases/adminactionresult/)\>

### Parameters

#### request

`Request`

### Returns

`Promise`\<`Response` \| [`AdminActionResult`](/api/admin/type-aliases/adminactionresult/)\>

## Example

```typescript
// app/admin.server.ts
import { createAdminAction, introspectSchema } from "@cfast/admin";
import * as schema from "~/schema";

const tableMetas = introspectSchema(schema);
export const adminAction = createAdminAction(config, tableMetas);
```
