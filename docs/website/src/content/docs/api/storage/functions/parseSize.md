---
editUrl: false
next: false
prev: false
title: "parseSize"
---

> **parseSize**(`size`): `number`

Defined in: [packages/storage/src/schema.ts:31](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/schema.ts#L31)

Parse a human-readable size string into bytes.

Supports `b`, `kb`, `mb`, and `gb` units (case-insensitive). Decimal values
are supported and the result is rounded to the nearest byte.

## Parameters

### size

`string`

Size string (e.g. `"10mb"`, `"1.5kb"`, `"500b"`, `"1gb"`).

## Returns

`number`

The size in bytes.

## Throws

If the format is invalid.

## Example

```ts
import { parseSize } from "@cfast/storage";

parseSize("2mb");   // 2097152
parseSize("1.5kb"); // 1536
parseSize("500b");  // 500
```
