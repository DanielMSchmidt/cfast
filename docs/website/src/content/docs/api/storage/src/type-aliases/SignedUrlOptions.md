---
editUrl: false
next: false
prev: false
title: "SignedUrlOptions"
---

> **SignedUrlOptions** = `object`

Defined in: [packages/storage/src/types.ts:111](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L111)

Options for generating a time-limited signed URL.

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:113](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L113)

Workers environment bindings (must include `STORAGE_SECRET`).

***

### expiresIn

> **expiresIn**: `string`

Defined in: [packages/storage/src/types.ts:115](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L115)

How long the URL is valid (e.g. `"1h"`, `"30m"`, `"7d"`).
