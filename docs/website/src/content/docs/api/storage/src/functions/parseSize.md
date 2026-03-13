---
editUrl: false
next: false
prev: false
title: "parseSize"
---

> **parseSize**(`size`): `number`

Defined in: [packages/storage/src/schema.ts:19](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/storage/src/schema.ts#L19)

Parse a human-readable size string into bytes.

## Parameters

### size

`string`

Size string (e.g. `"10mb"`, `"1.5kb"`, `"500b"`, `"1gb"`).

## Returns

`number`

The size in bytes.

## Throws

If the format is invalid.
