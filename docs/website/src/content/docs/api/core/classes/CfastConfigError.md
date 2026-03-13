---
editUrl: false
next: false
prev: false
title: "CfastConfigError"
---

Defined in: [packages/core/src/errors.ts:29](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/core/src/errors.ts#L29)

Error thrown for configuration issues detected at startup (e.g., duplicate plugin names).

## Extends

- `Error`

## Constructors

### Constructor

> **new CfastConfigError**(`message`): `CfastConfigError`

Defined in: [packages/core/src/errors.ts:33](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/core/src/errors.ts#L33)

#### Parameters

##### message

`string`

Description of the configuration error.

#### Returns

`CfastConfigError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

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

### stack?

> `optional` **stack**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

`Error.stack`
