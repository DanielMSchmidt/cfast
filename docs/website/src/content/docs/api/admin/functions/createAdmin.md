---
editUrl: false
next: false
prev: false
title: "createAdmin"
---

> **createAdmin**(`config`): `object`

Defined in: [packages/admin/src/create-admin.ts:40](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/admin/src/create-admin.ts#L40)

Create a complete admin panel from your Drizzle schema.

Introspects your schema, applies any [TableOverrides](/api/admin/type-aliases/tableoverrides/), and produces a
`{ loader, action, Component }` triple that you mount on a single React Router
route. The admin panel includes list views, detail views, create/edit forms,
user management, and a dashboard -- all derived from your schema and permissions.

For server/client code splitting, use the individual factories
([createAdminLoader](/api/admin/functions/createadminloader/), [createAdminAction](/api/admin/functions/createadminaction/), [createAdminComponent](/api/admin/functions/createadmincomponent/))
instead.

## Parameters

### config

[`AdminConfig`](/api/admin/type-aliases/adminconfig/)

The admin configuration including DB factory, auth adapter, and schema.

## Returns

`object`

An object with `loader`, `action`, and `Component` to mount on a React Router route.

### action()

> **action**: (`request`) => `Promise`\<`Response` \| [`AdminActionResult`](/api/admin/type-aliases/adminactionresult/)\>

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response` \| [`AdminActionResult`](/api/admin/type-aliases/adminactionresult/)\>

### Component()

> **Component**: () => `ReactElement`

#### Returns

`ReactElement`

### loader()

> **loader**: (`request`) => `Promise`\<[`AdminLoaderData`](/api/admin/type-aliases/adminloaderdata/)\>

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<[`AdminLoaderData`](/api/admin/type-aliases/adminloaderdata/)\>

## Example

```typescript
// app/routes/admin.tsx
import { createAdmin } from "@cfast/admin";
import * as schema from "~/schema";

const admin = createAdmin({
  db: (grants, user) => createDb({ d1: env.DB, schema, grants, user }),
  auth,
  schema,
  requiredRole: "admin",
});

export const loader = admin.loader;
export const action = admin.action;
export default admin.Component;
```
