---
editUrl: false
next: false
prev: false
title: "StorageError"
---

Defined in: [packages/storage/src/errors.ts:25](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/errors.ts#L25)

Typed error thrown by the storage validation and upload pipeline.

Includes a machine-readable [code](/api/storage/classes/storageerror/#code), a human-readable
[detail](/api/storage/classes/storageerror/#detail), and an HTTP [status](/api/storage/classes/storageerror/#status)
suitable for returning to the client.

## Example

```ts
import { StorageError } from "@cfast/storage";

try {
  await storage.handle("avatars", request, { env, user });
} catch (e) {
  if (e instanceof StorageError) {
    console.error(e.code);    // "FILE_TOO_LARGE"
    console.error(e.detail);  // "File is 5.2MB but max allowed is 2.0MB"
    console.error(e.status);  // 413
  }
}
```

## Extends

- `Error`

## Constructors

### Constructor

> **new StorageError**(`options`): `StorageError`

Defined in: [packages/storage/src/errors.ts:37](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/errors.ts#L37)

#### Parameters

##### options

[`StorageErrorOptions`](/api/storage/type-aliases/storageerroroptions/)

Error details including code, detail message, and HTTP status.

#### Returns

`StorageError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

`Error.cause`

***

### code

> `readonly` **code**: [`StorageErrorCode`](/api/storage/type-aliases/storageerrorcode/)

Defined in: [packages/storage/src/errors.ts:28](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/errors.ts#L28)

Machine-readable error code (e.g. `"FILE_TOO_LARGE"`).

***

### detail

> `readonly` **detail**: `string`

Defined in: [packages/storage/src/errors.ts:30](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/errors.ts#L30)

Human-readable description of the problem.

***

### message

> **message**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

`Error.message`

***

### name

> `readonly` **name**: `"StorageError"` = `"StorageError"`

Defined in: [packages/storage/src/errors.ts:26](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/errors.ts#L26)

#### Overrides

`Error.name`

***

### stack?

> `optional` **stack**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

`Error.stack`

***

### status

> `readonly` **status**: `number`

Defined in: [packages/storage/src/errors.ts:32](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/errors.ts#L32)

HTTP status code (e.g. 413, 415, 500).
