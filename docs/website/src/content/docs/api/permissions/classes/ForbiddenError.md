---
editUrl: false
next: false
prev: false
title: "ForbiddenError"
---

Defined in: [packages/permissions/src/errors.ts:23](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/errors.ts#L23)

Error thrown when a permission check fails during an operation.

Extends `Error` with structured fields for the denied action, target table,
and role. Includes a `toJSON()` method so it can be serialized across the
server/client boundary.

## Extends

- `Error`

## Constructors

### Constructor

> **new ForbiddenError**(`options`): `ForbiddenError`

Defined in: [packages/permissions/src/errors.ts:38](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/errors.ts#L38)

Creates a new `ForbiddenError`.

#### Parameters

##### options

`ForbiddenErrorOptions`

The action, table, and optional role/descriptors for the error.

#### Returns

`ForbiddenError`

#### Overrides

`Error.constructor`

## Properties

### action

> `readonly` **action**: [`PermissionAction`](/api/permissions/type-aliases/permissionaction/)

Defined in: [packages/permissions/src/errors.ts:25](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/errors.ts#L25)

The action that was denied (e.g., `"delete"`).

***

### cause?

> `optional` **cause**: `unknown`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

`Error.cause`

***

### descriptors

> `readonly` **descriptors**: [`PermissionDescriptor`](/api/permissions/type-aliases/permissiondescriptor/)[]

Defined in: [packages/permissions/src/errors.ts:31](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/errors.ts#L31)

The full list of permission descriptors that were checked.

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

### role

> `readonly` **role**: `string` \| `undefined`

Defined in: [packages/permissions/src/errors.ts:29](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/errors.ts#L29)

The role that lacked the permission, or `undefined` if not specified.

***

### stack?

> `optional` **stack**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

`Error.stack`

***

### table

> `readonly` **table**: [`DrizzleTable`](/api/permissions/type-aliases/drizzletable/)

Defined in: [packages/permissions/src/errors.ts:27](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/errors.ts#L27)

The Drizzle table the action targeted.

## Methods

### toJSON()

> **toJSON**(): `object`

Defined in: [packages/permissions/src/errors.ts:56](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/errors.ts#L56)

Serializes the error to a JSON-safe object for server-to-client transfer.

#### Returns

`object`

A plain object with `name`, `message`, `action`, `table`, and `role` fields.

##### action

> **action**: [`PermissionAction`](/api/permissions/type-aliases/permissionaction/)

##### message

> **message**: `string`

##### name

> **name**: `string`

##### role

> **role**: `string` \| `undefined`

##### table

> **table**: `string`
