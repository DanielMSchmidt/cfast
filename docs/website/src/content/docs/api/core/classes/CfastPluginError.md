---
editUrl: false
next: false
prev: false
title: "CfastPluginError"
---

Defined in: [packages/core/src/errors.ts:6](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/errors.ts#L6)

Error thrown when a plugin's `setup()` function fails during `app.context()`.

Wraps the original error with the plugin name for diagnostics.

## Extends

- `Error`

## Constructors

### Constructor

> **new CfastPluginError**(`pluginName`, `cause`): `CfastPluginError`

Defined in: [packages/core/src/errors.ts:16](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/errors.ts#L16)

#### Parameters

##### pluginName

`string`

The name of the plugin that failed.

##### cause

`unknown`

The original error thrown by the plugin's `setup()`.

#### Returns

`CfastPluginError`

#### Overrides

`Error.constructor`

## Properties

### cause

> `readonly` **cause**: `unknown`

Defined in: [packages/core/src/errors.ts:10](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/errors.ts#L10)

The original error thrown by the plugin.

#### Overrides

`Error.cause`

***

### message

> **message**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.name`

***

### pluginName

> `readonly` **pluginName**: `string`

Defined in: [packages/core/src/errors.ts:8](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/core/src/errors.ts#L8)

The name of the plugin whose `setup()` threw.

***

### stack?

> `optional` **stack**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

`Error.stack`
