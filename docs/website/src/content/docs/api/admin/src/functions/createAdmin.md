---
editUrl: false
next: false
prev: false
title: "createAdmin"
---

> **createAdmin**(`config`): `object`

Defined in: [packages/admin/src/create-admin.ts:21](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/admin/src/create-admin.ts#L21)

Create a complete admin panel from your Drizzle schema.

Returns `{ loader, action, Component }` — mount these on a single React Router route.

## Parameters

### config

[`AdminConfig`](/api/admin/src/type-aliases/adminconfig/)

## Returns

`object`

### action()

> **action**: (`request`) => `Promise`\<`Response` \| [`AdminActionResult`](/api/admin/src/type-aliases/adminactionresult/)\>

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response` \| [`AdminActionResult`](/api/admin/src/type-aliases/adminactionresult/)\>

### Component()

> **Component**: () => `ReactElement`

#### Returns

`ReactElement`

### loader()

> **loader**: (`request`) => `Promise`\<[`AdminLoaderData`](/api/admin/src/type-aliases/adminloaderdata/)\>

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<[`AdminLoaderData`](/api/admin/src/type-aliases/adminloaderdata/)\>

## Example

```typescript
const admin = createAdmin({ db, auth, schema });

export const loader = admin.loader;
export const action = admin.action;
export default admin.Component;
```
