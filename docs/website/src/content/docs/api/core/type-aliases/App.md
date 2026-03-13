---
editUrl: false
next: false
prev: false
title: "App"
---

> **App**\<`TSchema`, `TPermissions`, `TPluginContext`, `TClientContext`\> = `object`

Defined in: [packages/core/src/types.ts:120](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L120)

The app object returned by `createApp()` and extended by `.use()` calls.

Provides methods for environment initialization, per-request context creation,
route handler wrappers, plugin registration, and a composed React provider.

## Type Parameters

### TSchema

`TSchema` *extends* [`Schema`](/api/env/type-aliases/schema/)

The env schema type.

### TPermissions

`TPermissions` *extends* [`Permissions`](/api/permissions/type-aliases/permissions/)

The permissions definition type.

### TPluginContext

`TPluginContext`

The accumulated plugin context type.

### TClientContext

`TClientContext`

The accumulated client-side context type.

## Properties

### permissions

> **permissions**: `TPermissions`

Defined in: [packages/core/src/types.ts:165](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L165)

The permissions config passed to `createApp()`.

***

### Provider

> **Provider**: `ComponentType`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/core/src/types.ts:163](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L163)

Composed React provider tree from all registered plugins.

## Methods

### action()

> **action**\<`T`\>(`fn`): (`args`) => `Promise`\<`T`\>

Defined in: [packages/core/src/types.ts:143](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L143)

Convenience wrapper for React Router actions that auto-creates the app context.

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`ctx`, `args`) => `T` \| `Promise`\<`T`\>

#### Returns

> (`args`): `Promise`\<`T`\>

##### Parameters

###### args

[`RouteArgs`](/api/core/type-aliases/routeargs/)

##### Returns

`Promise`\<`T`\>

***

### context()

> **context**(`request`, `context?`): `Promise`\<[`AppContext`](/api/core/type-aliases/appcontext/)\<`TSchema`, `TPluginContext`\>\>

Defined in: [packages/core/src/types.ts:131](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L131)

Builds the per-request context by running each plugin's `setup()` in order.

#### Parameters

##### request

`Request`

##### context?

`unknown`

#### Returns

`Promise`\<[`AppContext`](/api/core/type-aliases/appcontext/)\<`TSchema`, `TPluginContext`\>\>

***

### env()

> **env**(): [`ParsedEnv`](/api/env/type-aliases/parsedenv/)\<`TSchema`\>

Defined in: [packages/core/src/types.ts:129](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L129)

Returns the typed, validated environment.

#### Returns

[`ParsedEnv`](/api/env/type-aliases/parsedenv/)\<`TSchema`\>

***

### init()

> **init**(`rawEnv`): `void`

Defined in: [packages/core/src/types.ts:127](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L127)

Validates and initializes environment bindings. Call once in the Workers entry point.

#### Parameters

##### rawEnv

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### loader()

> **loader**\<`T`\>(`fn`): (`args`) => `Promise`\<`T`\>

Defined in: [packages/core/src/types.ts:136](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L136)

Convenience wrapper for React Router loaders that auto-creates the app context.

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`ctx`, `args`) => `T` \| `Promise`\<`T`\>

#### Returns

> (`args`): `Promise`\<`T`\>

##### Parameters

###### args

[`RouteArgs`](/api/core/type-aliases/routeargs/)

##### Returns

`Promise`\<`T`\>

***

### use()

> **use**\<`TName`, `TProvides`, `TClient`\>(`plugin`): `App`\<`TSchema`, `TPermissions`, `TPluginContext` & `{ [K in string]: TProvides }`, `TClientContext` & `TClient` *extends* `object` ? `{ [K in string]: TClient }` : `unknown`\>

Defined in: [packages/core/src/types.ts:150](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/types.ts#L150)

Registers a plugin, extending the app's context type. Throws on duplicate names.

#### Type Parameters

##### TName

`TName` *extends* `string`

##### TProvides

`TProvides`

##### TClient

`TClient`

#### Parameters

##### plugin

[`CfastPlugin`](/api/core/type-aliases/cfastplugin/)\<`TName`, `TProvides`, `TPluginContext`, `TClient`\>

#### Returns

`App`\<`TSchema`, `TPermissions`, `TPluginContext` & `{ [K in string]: TProvides }`, `TClientContext` & `TClient` *extends* `object` ? `{ [K in string]: TClient }` : `unknown`\>
