# @cfast/storage Design

## Decisions

- **Custom HMAC signed URLs** (no AWS SDK) — fully Workers-compatible
- **Magic bytes validation** for common types (JPEG, PNG, WebP, GIF, PDF); skip for unknown signatures
- **Full multipart upload support** — stream splitting, parallel parts, abort on failure
- **Pipeline architecture** — each concern in its own module, independently testable

## Schema & Types

`defineStorage()` and `filetype()` produce a typed schema keyed by filetype name.

Key types:
- `FiletypeConfig` — accept, maxSize, bucket, key fn, hooks, replace, uploadable, multipartThreshold, partSize
- `StorageSchema` — record of name → FiletypeConfig
- `StorageInstance` — object with `handle()`, `serve()`, `getSignedUrl()`, `getPublicUrl()`, `clientConfig()`
- `UploadResult` — `{ key, size, type, url }`
- `HandleContext` — `{ env, user, input? }`
- Size strings (`"2mb"`) parsed to bytes via `parseSize()`

## Validation Pipeline

Four layers, each throws `StorageError` or passes:

1. `validateContentType(headers, accept[])` — checks Content-Type header
2. `validateContentLength(headers, maxSize)` — checks Content-Length header
3. `validateMagicBytes(stream, accept[])` — reads first ~12 bytes, validates signature, re-prepends bytes to stream
4. `validateByteCount(stream, maxSize)` — wraps stream with counting TransformStream

Magic bytes lookup:
- JPEG: `FF D8 FF`
- PNG: `89 50 4E 47`
- WebP: `52 49 46 46 ... 57 45 42 50`
- GIF: `47 49 46 38`
- PDF: `25 50 44 46`

`StorageError` codes: `INVALID_MIME_TYPE` (415), `FILE_TOO_LARGE` (413), `UPLOAD_FAILED` (500).

## Upload Pipeline

Two strategies based on file size vs `multipartThreshold` (default 5MB):

**Direct PUT:** Pipe validated stream to `bucket.put(key, stream)`.

**Multipart:**
- `bucket.createMultipartUpload(key)`
- Split stream into `partSize` chunks (default 10MB) via TransformStream
- Upload parts with concurrency limit (default 3)
- On success: `upload.complete(parts)`
- On failure: `upload.abort()`, throw `UPLOAD_FAILED`
- No retry in v1

**Lifecycle hooks:** `beforeUpload(file, ctx)` after validation, `afterUpload(result, ctx)` after upload.

**Replace mode:** List and delete objects at key prefix before uploading.

## Request Parsing & Serving

**Parsing:** `request.formData()` → extract first `File` entry → pass through pipeline.

**Serving:**
- `serve(name, key, { env, headers? })` — `bucket.get(key)` → Response with Content-Type/Content-Length
- `getPublicUrl(name, key)` — construct URL from `publicUrl` base on filetype config
- `getSignedUrl(name, key, { env, expiresIn })` — HMAC-SHA256 signed URL with expiry
- `verifySignedUrl(url, { env })` — verify HMAC signature and expiry

Signed URL format: `/storage/{name}/{key}?expires={timestamp}&sig={hmac}`. Secret from env binding `STORAGE_SECRET`.

## Client Hook

`useUpload(name)` React hook via `/client` entrypoint.

**Config delivery:** `storage.clientConfig()` extracts client-safe fields (accept, maxSize). Delivered via `StorageProvider` context.

**Hook API:** `accept`, `start(file)`, `progress` (0-100), `isUploading`, `result`, `error`, `validationError`, `reset()`.

**Progress:** Uses `XMLHttpRequest` with `upload.onprogress`.

**Client validation:** accept + maxSize checks before sending. No magic bytes (server-only).

## File Structure

```
packages/storage/src/
├── index.ts          # Public API: defineStorage, filetype, StorageError
├── client.ts         # Public API: StorageProvider, useUpload
├── types.ts          # All type definitions
├── errors.ts         # StorageError class
├── schema.ts         # defineStorage(), filetype(), parseSize(), clientConfig()
├── validation.ts     # validateContentType, validateContentLength, validateMagicBytes, validateByteCount
├── magic-bytes.ts    # MIME → magic byte signature lookup
├── upload.ts         # directPut(), multipartUpload(), replace logic
├── parse.ts          # parseRequest() — extract File from multipart form
├── serve.ts          # serve(), getPublicUrl(), getSignedUrl(), verifySignedUrl()
└── handle.ts         # handle() — orchestrates parse → validate → hooks → upload
```

Tests in `__tests__/`: schema, validation, magic-bytes, upload, handle, serve, client.

**Dependencies:** `@cfast/permissions` (workspace), `react` (peer for client). No external deps.
