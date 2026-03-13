---
editUrl: false
next: false
prev: false
title: "SignedUrlOptions"
---

> **SignedUrlOptions** = `object`

Defined in: [packages/storage/src/types.ts:111](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L111)

Options for generating a time-limited signed URL.

## Properties

### env

> **env**: `Record`\<`string`, `unknown`\>

Defined in: [packages/storage/src/types.ts:113](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L113)

Workers environment bindings (must include `STORAGE_SECRET`).

***

### expiresIn

> **expiresIn**: `string`

Defined in: [packages/storage/src/types.ts:115](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/types.ts#L115)

How long the URL is valid (e.g. `"1h"`, `"30m"`, `"7d"`).
