---
editUrl: false
next: false
prev: false
title: "createAdminComponent"
---

> **createAdminComponent**(`tableMetas`): () => `ReactElement`

Defined in: [packages/admin/src/components/admin-root.tsx:48](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/admin/src/components/admin-root.tsx#L48)

Create the root admin React component from introspected table metadata.

Returns a React component that reads [AdminLoaderData](/api/admin/type-aliases/adminloaderdata/) from React Router's
`useLoaderData` and [AdminActionResult](/api/admin/type-aliases/adminactionresult/) from `useActionData`, then renders
the appropriate admin view (dashboard, list, detail, create, edit, users, or error).

The component includes a sidebar, impersonation banner, and wraps everything in
a `ConfirmProvider` from `@cfast/ui`.

Use this instead of [createAdmin](/api/admin/functions/createadmin/) when you need server/client code splitting
(this function is safe for client bundles since it only depends on table metadata,
not on DB or auth server code).

## Parameters

### tableMetas

[`AdminTableMeta`](/api/admin/type-aliases/admintablemeta/)[]

Table metadata from [introspectSchema](/api/admin/functions/introspectschema/). Used to resolve Drizzle table references for forms and primary key lookups.

## Returns

A React component to use as the default export of your admin route.

> (): `ReactElement`

### Returns

`ReactElement`

## Example

```typescript
// app/routes/admin.tsx
import { createAdminComponent, introspectSchema } from "@cfast/admin";
import { adminLoader, adminAction } from "~/admin.server";
import * as schema from "~/schema";

const tableMetas = introspectSchema(schema);
const AdminComponent = createAdminComponent(tableMetas);

export const loader = adminLoader;
export const action = adminAction;
export default AdminComponent;
```
