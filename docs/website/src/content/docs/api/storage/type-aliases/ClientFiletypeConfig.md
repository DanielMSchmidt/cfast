---
editUrl: false
next: false
prev: false
title: "ClientFiletypeConfig"
---

> **ClientFiletypeConfig** = `object`

Defined in: [packages/storage/src/types.ts:167](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L167)

Client-safe subset of a file type's configuration, used for client-side validation.

Contains only the information needed by the `useUpload` hook to validate
files before uploading (accepted MIME types and max size). Does not expose
bucket names, key functions, or other server-only details.

## Properties

### accept

> **accept**: readonly `string`[]

Defined in: [packages/storage/src/types.ts:169](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L169)

MIME types accepted for this file type.

***

### maxSize

> **maxSize**: `string`

Defined in: [packages/storage/src/types.ts:171](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L171)

Human-readable maximum size string (e.g. `"10mb"`).

***

### maxSizeBytes

> **maxSizeBytes**: `number`

Defined in: [packages/storage/src/types.ts:173](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/storage/src/types.ts#L173)

Maximum size in bytes (pre-parsed for efficient client validation).
