---
editUrl: false
next: false
prev: false
title: "EnvError"
---

Defined in: [packages/env/src/errors.ts:9](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/env/src/errors.ts#L9)

Error thrown when one or more Cloudflare Worker bindings fail validation.

Contains all validation failures so they can be fixed in a single pass.
The `message` includes a formatted summary of every failing binding.

## Extends

- `Error`

## Constructors

### Constructor

> **new EnvError**(`errors`): `EnvError`

Defined in: [packages/env/src/errors.ts:18](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/env/src/errors.ts#L18)

Creates a new `EnvError` from one or more validation failures.

#### Parameters

##### errors

[`EnvValidationError`](/api/env/type-aliases/envvalidationerror/)[]

Array of validation failures, one per misconfigured binding.

#### Returns

`EnvError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

`Error.cause`

***

### errors

> `readonly` **errors**: [`EnvValidationError`](/api/env/type-aliases/envvalidationerror/)[]

Defined in: [packages/env/src/errors.ts:11](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/env/src/errors.ts#L11)

All binding validation failures that caused this error.

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
