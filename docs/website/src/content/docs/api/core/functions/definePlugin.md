---
editUrl: false
next: false
prev: false
title: "definePlugin"
---

## Call Signature

> **definePlugin**\<`TName`, `TProvides`, `TClient`\>(`config`): [`CfastPlugin`](/api/core/type-aliases/cfastplugin/)\<`TName`, `Awaited`\<`TProvides`\>, `unknown`, `TClient`\>

Defined in: [packages/core/src/define-plugin.ts:39](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/core/src/define-plugin.ts#L39)

Defines a cfast plugin for use with `createApp().use()`.

Has two call signatures:
- **Direct form** (no dependencies): `definePlugin({ name, setup, ... })` -- types are fully inferred.
- **Curried form** (with dependencies): `definePlugin<TRequires>()({ name, setup, ... })` --
  specify `TRequires` explicitly so `setup(ctx)` receives typed prior-plugin context.

### Type Parameters

#### TName

`TName` *extends* `string`

#### TProvides

`TProvides`

#### TClient

`TClient` = `unknown`

### Parameters

#### config

Plugin configuration with `name`, `setup`, and optional `Provider`/`client`.

##### client?

`TClient`

##### name

`TName`

##### Provider?

`ComponentType`\<\{ `children`: `ReactNode`; \}\>

##### setup

(`ctx`) => `TProvides` \| `Promise`\<`TProvides`\>

### Returns

[`CfastPlugin`](/api/core/type-aliases/cfastplugin/)\<`TName`, `Awaited`\<`TProvides`\>, `unknown`, `TClient`\>

A `CfastPlugin` instance ready to pass to `app.use()`.

### Example

```ts
// Leaf plugin (no dependencies)
const analyticsPlugin = definePlugin({
  name: 'analytics',
  setup(ctx) {
    return { track: (event: string) => {} };
  },
});

// Plugin with dependencies (curried)
import type { AuthPluginProvides } from '@cfast/auth';
const dbPlugin = definePlugin<AuthPluginProvides>()({
  name: 'db',
  setup(ctx) {
    ctx.auth.user; // typed from AuthPluginProvides
    return { client: createDb({}) };
  },
});
```

## Call Signature

> **definePlugin**\<`TRequires`\>(): \<`TName`, `TProvides`, `TClient`\>(`config`) => [`CfastPlugin`](/api/core/type-aliases/cfastplugin/)\<`TName`, `Awaited`\<`TProvides`\>, `TRequires`, `TClient`\>

Defined in: [packages/core/src/define-plugin.ts:51](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/core/src/define-plugin.ts#L51)

Defines a cfast plugin for use with `createApp().use()`.

Has two call signatures:
- **Direct form** (no dependencies): `definePlugin({ name, setup, ... })` -- types are fully inferred.
- **Curried form** (with dependencies): `definePlugin<TRequires>()({ name, setup, ... })` --
  specify `TRequires` explicitly so `setup(ctx)` receives typed prior-plugin context.

### Type Parameters

#### TRequires

`TRequires`

### Returns

A `CfastPlugin` instance ready to pass to `app.use()`.

> \<`TName`, `TProvides`, `TClient`\>(`config`): [`CfastPlugin`](/api/core/type-aliases/cfastplugin/)\<`TName`, `Awaited`\<`TProvides`\>, `TRequires`, `TClient`\>

#### Type Parameters

##### TName

`TName` *extends* `string`

##### TProvides

`TProvides`

##### TClient

`TClient` = `unknown`

#### Parameters

##### config

###### client?

`TClient`

###### name

`TName`

###### Provider?

`ComponentType`\<\{ `children`: `ReactNode`; \}\>

###### setup

(`ctx`) => `TProvides` \| `Promise`\<`TProvides`\>

#### Returns

[`CfastPlugin`](/api/core/type-aliases/cfastplugin/)\<`TName`, `Awaited`\<`TProvides`\>, `TRequires`, `TClient`\>

### Example

```ts
// Leaf plugin (no dependencies)
const analyticsPlugin = definePlugin({
  name: 'analytics',
  setup(ctx) {
    return { track: (event: string) => {} };
  },
});

// Plugin with dependencies (curried)
import type { AuthPluginProvides } from '@cfast/auth';
const dbPlugin = definePlugin<AuthPluginProvides>()({
  name: 'db',
  setup(ctx) {
    ctx.auth.user; // typed from AuthPluginProvides
    return { client: createDb({}) };
  },
});
```
