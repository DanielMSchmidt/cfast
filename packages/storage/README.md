# @cfast/storage

**Type-safe file uploads to Cloudflare R2. Define your file schema like you define your database schema.**

Uploading files on Cloudflare Workers is surprisingly manual. You're parsing multipart form data by hand, validating MIME types with string comparisons, juggling R2 bucket bindings, and hoping you remembered to set the right size limit. Every project reinvents this.

`@cfast/storage` gives you a Drizzle-like schema API for file storage. You declare file types, where they go, what's allowed, and the library handles multipart uploads, validation, and routing to the right R2 bucket. On the client, you get a drop-in upload hook with progress tracking.

## Design Goals

- **Schema-driven.** Define file types declaratively: allowed MIME types, max size, destination bucket, key pattern. Like Drizzle tables, but for files.
- **Multipart by default.** Large files use R2's multipart upload API automatically. Small files use direct PUT. The caller doesn't think about it.
- **Validated before upload.** File size and MIME type are checked before any bytes hit R2. On the client, validation runs before the request is even sent.
- **Permission-integrated.** File upload/download operations respect `@cfast/permissions`. A user who can't edit a post can't upload an image to it.
- **Type-safe end to end.** The schema defines what file types exist. The upload handler knows which schema entries accept which files. TypeScript catches mismatches.

## Planned API

### Defining a Storage Schema

```typescript
import { defineStorage, filetype } from "@cfast/storage";

export const storage = defineStorage({
  avatars: filetype({
    bucket: "UPLOADS",                     // R2 binding name from @cfast/env
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSize: "2mb",
    key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
    // One avatar per user — uploading replaces the previous one
    replace: true,
  }),

  postImages: filetype({
    bucket: "UPLOADS",
    accept: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSize: "10mb",
    key: (file, ctx) => `posts/${ctx.input.postId}/${crypto.randomUUID()}-${file.name}`,
  }),

  documents: filetype({
    bucket: "DOCUMENTS",                   // Different R2 bucket
    accept: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    maxSize: "50mb",
    key: (file, ctx) => `docs/${ctx.user.id}/${crypto.randomUUID()}-${file.name}`,
    // Large files use multipart automatically, but you can set the threshold
    multipartThreshold: "10mb",
  }),

  exports: filetype({
    bucket: "DOCUMENTS",
    accept: ["text/csv", "application/json"],
    maxSize: "200mb",
    // System-generated files, no direct user upload
    uploadable: false,
    key: (file) => `exports/${crypto.randomUUID()}.${file.extension}`,
  }),
});
```

### Server-Side Upload Handling

```typescript
import { storage } from "./storage";

// In a React Router action:
export async function action({ request, context }) {
  const user = await auth.requireUser(request);

  // Parse the multipart form and upload in one call
  const result = await storage.handle("postImages", request, {
    env: context.env,
    user,
    input: { postId: "123" }, // Available in the key function
  });

  // result: { key: "posts/123/abc-photo.jpg", size: 483210, type: "image/jpeg", url: "..." }

  // Save reference in your database
  const saveRef = db.insert(postImages).values({
    postId: sql.placeholder("postId"),
    storageKey: sql.placeholder("storageKey"),
    size: sql.placeholder("size"),
  });
  await saveRef.run({
    postId: "123",
    storageKey: result.key,
    size: result.size,
  });

  return { success: true, url: result.url };
}
```

### Validation

Validation happens in layers — fast failures first:

```typescript
const result = await storage.handle("avatars", request, { env, user });

// 1. Content-Type header checked before reading body     -> 415 Unsupported Media Type
// 2. Content-Length header checked before reading body    -> 413 Payload Too Large
// 3. MIME type verified by reading file magic bytes       -> 415 (prevents spoofed Content-Type)
// 4. Actual byte count verified during streaming upload   -> 413 (prevents spoofed Content-Length)
```

Validation errors are structured:

```typescript
import { StorageError } from "@cfast/storage";

try {
  await storage.handle("avatars", request, { env, user });
} catch (e) {
  if (e instanceof StorageError) {
    e.code;    // "FILE_TOO_LARGE" | "INVALID_MIME_TYPE" | "UPLOAD_FAILED"
    e.detail;  // "File is 5.2MB but avatars allows max 2MB"
    e.status;  // 413
  }
}
```

### Multipart Uploads

Large files are automatically uploaded using R2's multipart upload API:

```typescript
documents: filetype({
  bucket: "DOCUMENTS",
  maxSize: "200mb",
  multipartThreshold: "10mb",  // Files > 10MB use multipart (default: 5mb)
  partSize: "10mb",            // Size of each part (default: 10mb)
}),
```

The library handles:
- Splitting the incoming stream into parts
- Uploading parts in parallel (configurable concurrency)
- Completing or aborting the multipart upload
- Retrying failed parts

### Client-Side Upload Hook

```typescript
import { useUpload } from "@cfast/storage/client";

function AvatarUploader() {
  const upload = useUpload("avatars");

  return (
    <div>
      <input
        type="file"
        accept={upload.accept}       // "image/jpeg,image/png,image/webp" — from schema
        onChange={(e) => upload.start(e.target.files[0])}
      />

      {upload.validationError && (
        // Client-side validation runs before upload starts
        <p>{upload.validationError}</p>  // "File is 5.2MB but max is 2MB"
      )}

      {upload.isUploading && (
        <progress value={upload.progress} max={100} />
      )}

      {upload.result && (
        <img src={upload.result.url} alt="Avatar" />
      )}
    </div>
  );
}
```

The client hook validates before uploading:
- Checks file size against the schema's `maxSize`
- Checks MIME type against the schema's `accept`
- These checks use the same schema definition as the server — no duplication

### Serving Files

Generate signed URLs or serve files directly:

```typescript
// Signed URL (time-limited, for private files)
const url = await storage.getSignedUrl("documents", key, { expiresIn: "1h" });

// Public URL (for files in a public bucket)
const url = storage.getPublicUrl("postImages", key);

// Stream directly from R2 (for custom response headers, transforms, etc.)
const response = await storage.serve("postImages", key, {
  headers: { "Cache-Control": "public, max-age=31536000" },
});
```

### Permission Integration

File uploads are typically triggered by actions, and the action's operations carry the permission requirements. The storage layer itself doesn't check permissions — it handles bytes. The permission gate happens before the upload starts:

```typescript
const uploadPostImage = createAction({
  input: { postId: "" as string },

  operations: (db, input, ctx) => {
    // The update permission on posts gates the upload
    const checkAccess = db.query(posts).findFirst({
      where: eq(posts.id, sql.placeholder("postId")),
    });

    const saveRef = db.insert(postImages).values({
      postId: sql.placeholder("postId"),
      storageKey: sql.placeholder("storageKey"),
      size: sql.placeholder("size"),
    });

    return compose([checkAccess, saveRef], async (doCheck, doSave) => {
      await doCheck({ postId: input.postId });
      const result = await storage.handle("postImages", ctx.request, {
        env: ctx.env,
        user: ctx.user,
        input: { postId: input.postId },
      });
      await doSave({
        postId: input.postId,
        storageKey: result.key,
        size: result.size,
      });
      return { url: result.url };
    });
  },
});
```

The action's `.permissions` includes both `read` on `posts` and `create` on `postImages`, so the client can check `permitted` before showing the upload UI.

### Lifecycle Hooks

Run code before and after uploads:

```typescript
postImages: filetype({
  // ...
  hooks: {
    beforeUpload: async (file, ctx) => {
      // e.g., check quota, resize image, generate thumbnail key
    },
    afterUpload: async (result, ctx) => {
      // e.g., save to database, trigger image processing queue
    },
  },
}),
```

## Architecture

```
@cfast/storage (server)
├── Schema definition (defineStorage, filetype)
├── Multipart form parsing (streaming, no buffering)
├── Validation pipeline (headers → magic bytes → byte count)
├── R2 upload (direct PUT or multipart depending on size)
├── Signed URL generation
└── Permission checks (delegates to @cfast/permissions)

@cfast/storage/client
├── useUpload hook (progress, validation, error handling)
├── Client-side validation (size + MIME from schema)
└── Accept attribute generation
```
