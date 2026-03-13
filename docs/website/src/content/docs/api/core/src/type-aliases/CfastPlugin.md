---
editUrl: false
next: false
prev: false
title: "CfastPlugin"
---

> **CfastPlugin**\<`TName`, `TProvides`, `TRequires`, `TClient`\> = `object`

Defined in: [packages/core/src/types.ts:47](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L47)

A cfast plugin definition created by [definePlugin](/api/core/src/functions/defineplugin/).

Plugins provide server-side context values via `setup()`, optional client-side React providers,
and optional client-side values accessible via `useApp()`.

## Type Parameters

### TName

`TName` *extends* `string` = `string`

The unique plugin name, used as the namespace key in `AppContext`.

### TProvides

`TProvides` = `unknown`

The type returned by `setup()`, accessible as `ctx[name]`.

### TRequires

`TRequires` = `unknown`

The context shape this plugin depends on from prior plugins.

### TClient

`TClient` = `unknown`

Client-side values exposed via `useApp()`.

## Properties

### client?

> `optional` **client**: `TClient`

Defined in: [packages/core/src/types.ts:62](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L62)

Optional client-side values exposed via `useApp()`.

***

### name

> **name**: `TName`

Defined in: [packages/core/src/types.ts:54](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L54)

Unique identifier used as the namespace key in the app context.

***

### Provider?

> `optional` **Provider**: `ComponentType`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/core/src/types.ts:60](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L60)

Optional client-side React provider, composed into `app.Provider`.

***

### setup()

> **setup**: (`ctx`) => `TProvides` \| `Promise`\<`TProvides`\>

Defined in: [packages/core/src/types.ts:56](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/core/src/types.ts#L56)

Called per-request to produce the values this plugin provides.

#### Parameters

##### ctx

[`PluginSetupContext`](/api/core/src/type-aliases/pluginsetupcontext/)\<`TRequires`\>

#### Returns

`TProvides` \| `Promise`\<`TProvides`\>
