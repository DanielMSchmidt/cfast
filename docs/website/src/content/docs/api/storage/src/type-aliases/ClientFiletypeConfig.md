---
editUrl: false
next: false
prev: false
title: "ClientFiletypeConfig"
---

> **ClientFiletypeConfig** = `object`

Defined in: [packages/storage/src/types.ts:98](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L98)

Client-safe subset of a file type's configuration, used for client-side validation.

## Properties

### accept

> **accept**: readonly `string`[]

Defined in: [packages/storage/src/types.ts:100](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L100)

MIME types accepted for this file type.

***

### maxSize

> **maxSize**: `string`

Defined in: [packages/storage/src/types.ts:102](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L102)

Human-readable maximum size string (e.g. `"10mb"`).

***

### maxSizeBytes

> **maxSizeBytes**: `number`

Defined in: [packages/storage/src/types.ts:104](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/storage/src/types.ts#L104)

Maximum size in bytes (pre-parsed for efficient client validation).
