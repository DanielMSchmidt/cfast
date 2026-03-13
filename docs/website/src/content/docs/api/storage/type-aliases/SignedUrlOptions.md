---
editUrl: false
next: false
prev: false
title: "SignedUrlOptions"
---

> **SignedUrlOptions** = `object`

Defined in: [packages/storage/src/types.ts:188](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L188)

Options for generating a time-limited HMAC-signed URL for private file access.

Requires a `STORAGE_SECRET` binding in the Workers environment for HMAC signing.

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:190](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L190)

Workers environment bindings (must include `STORAGE_SECRET`).

***

### expiresIn

> **expiresIn**: `string`

Defined in: [packages/storage/src/types.ts:192](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L192)

How long the URL is valid (e.g. `"1h"`, `"30m"`, `"7d"`).
