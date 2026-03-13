---
editUrl: false
next: false
prev: false
title: "createAdminLoader"
---

> **createAdminLoader**(`config`, `tableMetas`): (`request`) => `Promise`\<[`AdminLoaderData`](/api/admin/type-aliases/adminloaderdata/)\>

Defined in: [packages/admin/src/loader.ts:573](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/admin/src/loader.ts#L573)

Create an admin loader function from config and introspected table metadata.

The returned loader handles all admin views: dashboard, table list, detail,
create, edit, user list, and user detail. It guards access using the
[AdminAuthConfig.requireUser](/api/admin/type-aliases/adminauthconfig/#requireuser) and [AdminAuthConfig.hasRole](/api/admin/type-aliases/adminauthconfig/#hasrole) callbacks,
creates a permission-scoped DB instance via [CreateDbFn](/api/admin/type-aliases/createdbfn/), and parses the
URL to determine which view data to fetch.

Use this instead of [createAdmin](/api/admin/functions/createadmin/) when you need server/client code splitting.

## Parameters

### config

[`AdminConfig`](/api/admin/type-aliases/adminconfig/)

The admin configuration (same object passed to [createAdmin](/api/admin/functions/createadmin/)).

### tableMetas

[`AdminTableMeta`](/api/admin/type-aliases/admintablemeta/)[]

Table metadata from [introspectSchema](/api/admin/functions/introspectschema/).

## Returns

An async function that takes a `Request` and returns [AdminLoaderData](/api/admin/type-aliases/adminloaderdata/).

> (`request`): `Promise`\<[`AdminLoaderData`](/api/admin/type-aliases/adminloaderdata/)\>

### Parameters

#### request

`Request`

### Returns

`Promise`\<[`AdminLoaderData`](/api/admin/type-aliases/adminloaderdata/)\>

## Example

```typescript
// app/admin.server.ts
import { createAdminLoader, introspectSchema } from "@cfast/admin";
import * as schema from "~/schema";

const tableMetas = introspectSchema(schema);
export const adminLoader = createAdminLoader(config, tableMetas);
```
