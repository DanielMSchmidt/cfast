---
editUrl: false
next: false
prev: false
title: "createApp"
---

> **createApp**\<`TSchema`, `TPermissions`\>(`config`): [`App`](/api/core/src/type-aliases/app/)\<`TSchema`, `TPermissions`, `unknown`, `unknown`\>

Defined in: [packages/core/src/create-app.ts:34](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/core/src/create-app.ts#L34)

Creates a cfast application instance that wires env, permissions, and plugins into a typed per-request context.

Call `.use(plugin)` to register plugins, then use `app.context(request, context)` in route
loaders/actions to build the per-request context with all plugin values.

## Type Parameters

### TSchema

`TSchema` *extends* [`Schema`](/api/env/src/type-aliases/schema/)

### TPermissions

`TPermissions` *extends* [`Permissions`](/api/permissions/src/type-aliases/permissions/)

## Parameters

### config

[`CreateAppConfig`](/api/core/src/type-aliases/createappconfig/)\<`TSchema`, `TPermissions`\>

Application configuration containing the env schema and permissions definition.

## Returns

[`App`](/api/core/src/type-aliases/app/)\<`TSchema`, `TPermissions`, `unknown`, `unknown`\>

An `App` instance with methods for context creation, route helpers, and plugin registration.

## Example

```ts
import { createApp } from '@cfast/core';
import { authPlugin } from '@cfast/auth';
import { envSchema } from './env';
import { permissions } from './permissions';

export const app = createApp({ env: envSchema, permissions })
  .use(authPlugin({ magicLink: { sendMagicLink: async ({ email, url }) => {} } }));
```
