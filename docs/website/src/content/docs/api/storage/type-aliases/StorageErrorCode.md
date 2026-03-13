---
editUrl: false
next: false
prev: false
title: "StorageErrorCode"
---

> **StorageErrorCode** = `"FILE_TOO_LARGE"` \| `"INVALID_MIME_TYPE"` \| `"UPLOAD_FAILED"`

Defined in: [packages/storage/src/types.ts:8](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/storage/src/types.ts#L8)

Machine-readable error codes produced by the storage validation and upload pipeline.

- `"FILE_TOO_LARGE"` — The file exceeds the configured `maxSize` (HTTP 413).
- `"INVALID_MIME_TYPE"` — The file's MIME type is not in the `accept` list (HTTP 415).
- `"UPLOAD_FAILED"` — The R2 upload operation failed (HTTP 500).
