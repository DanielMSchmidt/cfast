# @cfast/storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement type-safe file uploads to Cloudflare R2 with multipart support, magic bytes validation, HMAC signed URLs, and a client-side upload hook.

**Architecture:** Pipeline architecture — each concern (parsing, validation, upload, serving) in its own module. `defineStorage()` composes them into a typed `StorageInstance`. Client hook uses a React context provider to receive schema config.

**Tech Stack:** Cloudflare Workers (R2 API), Web Crypto API (HMAC-SHA256), React (client hook), Vitest (tests)

---

### Task 1: Types and Errors

**Files:**
- Create: `packages/storage/src/types.ts`
- Create: `packages/storage/src/errors.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/errors.test.ts`:

```typescript
import { StorageError } from "../errors.js";

describe("StorageError", () => {
  it("creates FILE_TOO_LARGE error with status 413", () => {
    const err = new StorageError({
      code: "FILE_TOO_LARGE",
      detail: "File is 5.2MB but avatars allows max 2MB",
      status: 413,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("StorageError");
    expect(err.code).toBe("FILE_TOO_LARGE");
    expect(err.detail).toBe("File is 5.2MB but avatars allows max 2MB");
    expect(err.status).toBe(413);
    expect(err.message).toBe("File is 5.2MB but avatars allows max 2MB");
  });

  it("creates INVALID_MIME_TYPE error with status 415", () => {
    const err = new StorageError({
      code: "INVALID_MIME_TYPE",
      detail: "image/bmp is not accepted, allowed: image/jpeg, image/png",
      status: 415,
    });

    expect(err.code).toBe("INVALID_MIME_TYPE");
    expect(err.status).toBe(415);
  });

  it("creates UPLOAD_FAILED error with status 500", () => {
    const err = new StorageError({
      code: "UPLOAD_FAILED",
      detail: "R2 upload failed: connection reset",
      status: 500,
    });

    expect(err.code).toBe("UPLOAD_FAILED");
    expect(err.status).toBe(500);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/errors.test.ts`
Expected: FAIL — cannot find `../errors.js`

**Step 3: Write types and error class**

Create `packages/storage/src/types.ts`:

```typescript
export type StorageErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_MIME_TYPE"
  | "UPLOAD_FAILED";

export type StorageErrorOptions = {
  code: StorageErrorCode;
  detail: string;
  status: number;
};

export type FiletypeConfig<TInput = Record<string, unknown>> = {
  bucket: string;
  accept: readonly string[];
  maxSize: string;
  key: (file: { name: string; extension: string }, ctx: KeyContext<TInput>) => string;
  replace?: boolean;
  uploadable?: boolean;
  multipartThreshold?: string;
  partSize?: string;
  publicUrl?: string;
  hooks?: FiletypeHooks<TInput>;
};

export type FiletypeHooks<TInput = Record<string, unknown>> = {
  beforeUpload?: (file: FileInfo, ctx: HandleContext<TInput>) => Promise<void>;
  afterUpload?: (result: UploadResult, ctx: HandleContext<TInput>) => Promise<void>;
};

export type KeyContext<TInput = Record<string, unknown>> = {
  user: { id: string; [key: string]: unknown };
  input: TInput;
};

export type HandleContext<TInput = Record<string, unknown>> = {
  env: Record<string, unknown>;
  user: { id: string; [key: string]: unknown };
  input?: TInput;
};

export type FileInfo = {
  name: string;
  extension: string;
  type: string;
  size: number;
};

export type UploadResult = {
  key: string;
  size: number;
  type: string;
};

export type StorageSchema = Record<string, FiletypeConfig<any>>;

export type ClientFiletypeConfig = {
  accept: readonly string[];
  maxSize: string;
  maxSizeBytes: number;
};

export type ClientStorageConfig = Record<string, ClientFiletypeConfig>;

export type SignedUrlOptions = {
  env: Record<string, unknown>;
  expiresIn: string;
};

export type ServeOptions = {
  env: Record<string, unknown>;
  headers?: Record<string, string>;
};

export type StorageInstance<T extends StorageSchema> = {
  schema: T;
  handle: <K extends keyof T & string>(
    name: K,
    request: Request,
    ctx: HandleContext<T[K] extends FiletypeConfig<infer I> ? I : Record<string, unknown>>,
  ) => Promise<UploadResult>;
  serve: (name: keyof T & string, key: string, options: ServeOptions) => Promise<Response>;
  getPublicUrl: (name: keyof T & string, key: string) => string;
  getSignedUrl: (name: keyof T & string, key: string, options: SignedUrlOptions) => Promise<string>;
  verifySignedUrl: (url: string, options: { env: Record<string, unknown> }) => Promise<boolean>;
  clientConfig: () => ClientStorageConfig;
};
```

Create `packages/storage/src/errors.ts`:

```typescript
import type { StorageErrorCode, StorageErrorOptions } from "./types.js";

export class StorageError extends Error {
  readonly name = "StorageError";
  readonly code: StorageErrorCode;
  readonly detail: string;
  readonly status: number;

  constructor(options: StorageErrorOptions) {
    super(options.detail);
    this.code = options.code;
    this.detail = options.detail;
    this.status = options.status;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/errors.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add packages/storage/src/types.ts packages/storage/src/errors.ts packages/storage/src/__tests__/errors.test.ts
git commit -m "feat(storage): add types and StorageError class"
```

---

### Task 2: Schema — `parseSize()` and `filetype()`

**Files:**
- Create: `packages/storage/src/schema.ts`
- Create: `packages/storage/src/__tests__/schema.test.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/schema.test.ts`:

```typescript
import { parseSize, filetype } from "../schema.js";

describe("parseSize", () => {
  it("parses bytes", () => {
    expect(parseSize("100b")).toBe(100);
    expect(parseSize("0b")).toBe(0);
  });

  it("parses kilobytes", () => {
    expect(parseSize("1kb")).toBe(1024);
    expect(parseSize("1.5kb")).toBe(1536);
  });

  it("parses megabytes", () => {
    expect(parseSize("2mb")).toBe(2 * 1024 * 1024);
    expect(parseSize("10mb")).toBe(10 * 1024 * 1024);
  });

  it("parses gigabytes", () => {
    expect(parseSize("1gb")).toBe(1024 * 1024 * 1024);
  });

  it("is case insensitive", () => {
    expect(parseSize("2MB")).toBe(2 * 1024 * 1024);
    expect(parseSize("1Kb")).toBe(1024);
  });

  it("throws on invalid format", () => {
    expect(() => parseSize("abc")).toThrow();
    expect(() => parseSize("")).toThrow();
    expect(() => parseSize("10")).toThrow();
  });
});

describe("filetype", () => {
  it("returns the config with defaults applied", () => {
    const config = filetype({
      bucket: "UPLOADS",
      accept: ["image/jpeg", "image/png"],
      maxSize: "2mb",
      key: (file) => `images/${file.name}`,
    });

    expect(config.bucket).toBe("UPLOADS");
    expect(config.accept).toEqual(["image/jpeg", "image/png"]);
    expect(config.maxSize).toBe("2mb");
    expect(config.uploadable).toBe(true);
    expect(config.multipartThreshold).toBe("5mb");
    expect(config.partSize).toBe("10mb");
    expect(config.replace).toBe(false);
  });

  it("respects explicit overrides", () => {
    const config = filetype({
      bucket: "DOCS",
      accept: ["application/pdf"],
      maxSize: "50mb",
      key: (file) => file.name,
      uploadable: false,
      replace: true,
      multipartThreshold: "20mb",
      partSize: "5mb",
    });

    expect(config.uploadable).toBe(false);
    expect(config.replace).toBe(true);
    expect(config.multipartThreshold).toBe("20mb");
    expect(config.partSize).toBe("5mb");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/schema.test.ts`
Expected: FAIL — cannot find `../schema.js`

**Step 3: Write implementation**

Create `packages/storage/src/schema.ts`:

```typescript
import type { FiletypeConfig, StorageSchema, StorageInstance, ClientStorageConfig } from "./types.js";

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
};

export function parseSize(size: string): number {
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid size format: "${size}". Expected format: "10mb", "1.5kb", etc.`);
  }
  const value = parseFloat(match[1]);
  const unit = match[2];
  return Math.round(value * SIZE_UNITS[unit]);
}

export function filetype<TInput = Record<string, unknown>>(
  config: FiletypeConfig<TInput>,
): FiletypeConfig<TInput> & { uploadable: boolean; replace: boolean; multipartThreshold: string; partSize: string } {
  return {
    ...config,
    uploadable: config.uploadable ?? true,
    replace: config.replace ?? false,
    multipartThreshold: config.multipartThreshold ?? "5mb",
    partSize: config.partSize ?? "10mb",
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/storage/src/schema.ts packages/storage/src/__tests__/schema.test.ts
git commit -m "feat(storage): parseSize utility and filetype factory"
```

---

### Task 3: Magic Bytes Detection

**Files:**
- Create: `packages/storage/src/magic-bytes.ts`
- Create: `packages/storage/src/__tests__/magic-bytes.test.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/magic-bytes.test.ts`:

```typescript
import { detectMimeType, SIGNATURES } from "../magic-bytes.js";

describe("SIGNATURES", () => {
  it("has entries for common image types", () => {
    expect(SIGNATURES.some((s) => s.mime === "image/jpeg")).toBe(true);
    expect(SIGNATURES.some((s) => s.mime === "image/png")).toBe(true);
    expect(SIGNATURES.some((s) => s.mime === "image/webp")).toBe(true);
    expect(SIGNATURES.some((s) => s.mime === "image/gif")).toBe(true);
    expect(SIGNATURES.some((s) => s.mime === "application/pdf")).toBe(true);
  });
});

describe("detectMimeType", () => {
  it("detects JPEG", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00]);
    expect(detectMimeType(bytes)).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectMimeType(bytes)).toBe("image/png");
  });

  it("detects WebP", () => {
    // RIFF....WEBP
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectMimeType(bytes)).toBe("image/webp");
  });

  it("detects GIF", () => {
    // GIF89a
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(detectMimeType(bytes)).toBe("image/gif");
  });

  it("detects PDF", () => {
    // %PDF
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(detectMimeType(bytes)).toBe("application/pdf");
  });

  it("returns null for unknown bytes", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(detectMimeType(bytes)).toBeNull();
  });

  it("returns null for empty input", () => {
    const bytes = new Uint8Array(0);
    expect(detectMimeType(bytes)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/magic-bytes.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `packages/storage/src/magic-bytes.ts`:

```typescript
export type MagicSignature = {
  mime: string;
  bytes: number[];
  offset?: number;
};

export const SIGNATURES: readonly MagicSignature[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  // WebP: starts with RIFF, then 4 bytes of file size, then WEBP
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

export function detectMimeType(header: Uint8Array): string | null {
  if (header.length === 0) return null;

  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (header.length < offset + sig.bytes.length) continue;

    const matches = sig.bytes.every((b, i) => header[offset + i] === b);
    if (!matches) continue;

    // Special case: WebP needs a second check at offset 8
    if (sig.mime === "image/webp") {
      if (header.length < 12) continue;
      const webpMatch = WEBP_MARKER.every((b, i) => header[8 + i] === b);
      if (!webpMatch) continue;
    }

    return sig.mime;
  }

  return null;
}

/** Maximum number of bytes needed to detect any known signature */
export const MAX_HEADER_SIZE = 12;
```

**Step 4: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/magic-bytes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/storage/src/magic-bytes.ts packages/storage/src/__tests__/magic-bytes.test.ts
git commit -m "feat(storage): magic bytes MIME type detection"
```

---

### Task 4: Validation Pipeline

**Files:**
- Create: `packages/storage/src/validation.ts`
- Create: `packages/storage/src/__tests__/validation.test.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/validation.test.ts`:

```typescript
import { StorageError } from "../errors.js";
import {
  validateContentType,
  validateContentLength,
  validateMagicBytes,
  createByteCountingStream,
} from "../validation.js";

describe("validateContentType", () => {
  it("passes for accepted MIME type", () => {
    expect(() =>
      validateContentType("image/jpeg", ["image/jpeg", "image/png"]),
    ).not.toThrow();
  });

  it("throws INVALID_MIME_TYPE for rejected type", () => {
    expect(() =>
      validateContentType("image/bmp", ["image/jpeg", "image/png"]),
    ).toThrow(StorageError);

    try {
      validateContentType("image/bmp", ["image/jpeg", "image/png"]);
    } catch (e) {
      expect((e as StorageError).code).toBe("INVALID_MIME_TYPE");
      expect((e as StorageError).status).toBe(415);
    }
  });

  it("throws for missing content type", () => {
    expect(() => validateContentType(null, ["image/jpeg"])).toThrow(StorageError);
  });
});

describe("validateContentLength", () => {
  it("passes when under limit", () => {
    expect(() => validateContentLength(1000, 2000)).not.toThrow();
  });

  it("passes when at limit", () => {
    expect(() => validateContentLength(2000, 2000)).not.toThrow();
  });

  it("throws FILE_TOO_LARGE when over limit", () => {
    expect(() => validateContentLength(3000, 2000)).toThrow(StorageError);

    try {
      validateContentLength(3000, 2000);
    } catch (e) {
      expect((e as StorageError).code).toBe("FILE_TOO_LARGE");
      expect((e as StorageError).status).toBe(413);
    }
  });

  it("skips check when size is null (unknown)", () => {
    expect(() => validateContentLength(null, 2000)).not.toThrow();
  });
});

describe("validateMagicBytes", () => {
  it("passes when magic bytes match accepted type", async () => {
    // JPEG magic bytes
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0x00)]);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const result = await validateMagicBytes(stream, ["image/jpeg", "image/png"]);
    expect(result.validated).toBe(true);

    // The returned stream should still contain all original bytes
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const read = await reader.read();
      if (read.value) chunks.push(read.value);
      done = read.done;
    }
    const total = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      total.set(chunk, offset);
      offset += chunk.length;
    }
    expect(total.length).toBe(data.length);
    expect(total[0]).toBe(0xff);
    expect(total[1]).toBe(0xd8);
  });

  it("throws INVALID_MIME_TYPE when bytes don't match accepted types", async () => {
    // PNG magic bytes but only JPEG accepted
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array(50).fill(0x00)]);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    await expect(validateMagicBytes(stream, ["image/jpeg"])).rejects.toThrow(StorageError);
  });

  it("skips validation for unknown MIME types", async () => {
    // Random bytes, accepting application/msword (no known magic)
    const data = new Uint8Array([0x01, 0x02, 0x03, ...Array(50).fill(0x00)]);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const result = await validateMagicBytes(stream, ["application/msword"]);
    expect(result.validated).toBe(false); // skipped, not validated
  });
});

describe("createByteCountingStream", () => {
  it("counts bytes passing through", async () => {
    const data = new Uint8Array(1500);
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const { stream, getByteCount } = createByteCountingStream(source, 2000);

    const reader = stream.getReader();
    while (!(await reader.read()).done) {}

    expect(getByteCount()).toBe(1500);
  });

  it("throws FILE_TOO_LARGE when exceeding limit", async () => {
    const chunk1 = new Uint8Array(1500);
    const chunk2 = new Uint8Array(1000);
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const { stream } = createByteCountingStream(source, 2000);
    const reader = stream.getReader();

    await expect(async () => {
      while (!(await reader.read()).done) {}
    }).rejects.toThrow(StorageError);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/validation.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `packages/storage/src/validation.ts`:

```typescript
import { StorageError } from "./errors.js";
import { detectMimeType, MAX_HEADER_SIZE } from "./magic-bytes.js";

export function validateContentType(
  contentType: string | null,
  accept: readonly string[],
): void {
  if (!contentType) {
    throw new StorageError({
      code: "INVALID_MIME_TYPE",
      detail: "Missing Content-Type header",
      status: 415,
    });
  }

  // Strip parameters (e.g. "image/jpeg; charset=utf-8" → "image/jpeg")
  const mime = contentType.split(";")[0].trim().toLowerCase();

  if (!accept.includes(mime)) {
    throw new StorageError({
      code: "INVALID_MIME_TYPE",
      detail: `${mime} is not accepted, allowed: ${accept.join(", ")}`,
      status: 415,
    });
  }
}

export function validateContentLength(
  contentLength: number | null,
  maxSizeBytes: number,
): void {
  if (contentLength === null) return;

  if (contentLength > maxSizeBytes) {
    const sizeMB = (contentLength / (1024 * 1024)).toFixed(1);
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    throw new StorageError({
      code: "FILE_TOO_LARGE",
      detail: `File is ${sizeMB}MB but max allowed is ${maxMB}MB`,
      status: 413,
    });
  }
}

export async function validateMagicBytes(
  stream: ReadableStream<Uint8Array>,
  accept: readonly string[],
): Promise<{ stream: ReadableStream<Uint8Array>; validated: boolean }> {
  const reader = stream.getReader();

  // Read enough bytes for magic detection
  const headerChunks: Uint8Array[] = [];
  let headerSize = 0;

  while (headerSize < MAX_HEADER_SIZE) {
    const { value, done } = await reader.read();
    if (done) break;
    headerChunks.push(value);
    headerSize += value.length;
  }

  // Combine header bytes
  const header = new Uint8Array(headerSize);
  let offset = 0;
  for (const chunk of headerChunks) {
    header.set(chunk, offset);
    offset += chunk.length;
  }

  // Detect MIME type from magic bytes
  const detected = detectMimeType(header);

  if (detected !== null) {
    // We detected a known type — check if it's in the accept list
    if (!accept.includes(detected)) {
      reader.releaseLock();
      throw new StorageError({
        code: "INVALID_MIME_TYPE",
        detail: `File signature indicates ${detected}, which is not in accepted types: ${accept.join(", ")}`,
        status: 415,
      });
    }
  }

  // Re-create stream with header bytes prepended
  const newStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Emit the header bytes first
      controller.enqueue(header);

      // Then pipe the rest of the original stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return { stream: newStream, validated: detected !== null };
}

export function createByteCountingStream(
  source: ReadableStream<Uint8Array>,
  maxSizeBytes: number,
): { stream: ReadableStream<Uint8Array>; getByteCount: () => number } {
  let byteCount = 0;
  const reader = source.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      byteCount += value.length;

      if (byteCount > maxSizeBytes) {
        controller.error(
          new StorageError({
            code: "FILE_TOO_LARGE",
            detail: `File exceeds max allowed size of ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`,
            status: 413,
          }),
        );
        return;
      }

      controller.enqueue(value);
    },
  });

  return { stream, getByteCount: () => byteCount };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/storage/src/validation.ts packages/storage/src/__tests__/validation.test.ts
git commit -m "feat(storage): validation pipeline (content-type, size, magic bytes, byte counting)"
```

---

### Task 5: Request Parsing

**Files:**
- Create: `packages/storage/src/parse.ts`
- Create: `packages/storage/src/__tests__/parse.test.ts`
- Create: `packages/storage/src/__tests__/helpers.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/helpers.ts`:

```typescript
export function createMockR2Bucket(options?: {
  putResult?: R2Object;
  getResult?: R2ObjectBody | null;
  listResult?: R2Objects;
  deleteResult?: void;
}): R2Bucket {
  const uploaded: Array<{ key: string; value: unknown; options?: unknown }> = [];
  const deleted: string[] = [];

  return {
    _uploaded: uploaded,
    _deleted: deleted,
    put: vi.fn(async (key: string, value: unknown, opts?: unknown) => {
      uploaded.push({ key, value, options: opts });
      return (options?.putResult ?? { key, size: 100, uploaded: new Date() }) as R2Object;
    }),
    get: vi.fn(async () => options?.getResult ?? null),
    delete: vi.fn(async (keys: string | string[]) => {
      const keyArr = Array.isArray(keys) ? keys : [keys];
      deleted.push(...keyArr);
    }),
    list: vi.fn(async () => options?.listResult ?? { objects: [], truncated: false }),
    head: vi.fn(async () => null),
    createMultipartUpload: vi.fn(async (key: string) => ({
      key,
      uploadId: "mock-upload-id",
      uploadPart: vi.fn(async (partNumber: number, value: unknown) => ({
        partNumber,
        etag: `etag-${partNumber}`,
      })),
      complete: vi.fn(async () => ({ key, size: 100 } as R2Object)),
      abort: vi.fn(async () => {}),
    })),
  } as unknown as R2Bucket;
}

export function createMockFormDataRequest(
  file: { name: string; type: string; content: Uint8Array },
  actionUrl = "/upload",
): Request {
  const formData = new FormData();
  const blob = new Blob([file.content], { type: file.type });
  formData.append("file", blob, file.name);
  return new Request(`http://localhost${actionUrl}`, {
    method: "POST",
    body: formData,
  });
}
```

Create `packages/storage/src/__tests__/parse.test.ts`:

```typescript
import { parseRequest } from "../parse.js";
import { createMockFormDataRequest } from "./helpers.js";

describe("parseRequest", () => {
  it("extracts file from multipart form data", async () => {
    const content = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
    const request = createMockFormDataRequest({
      name: "photo.jpg",
      type: "image/jpeg",
      content,
    });

    const file = await parseRequest(request);

    expect(file.name).toBe("photo.jpg");
    expect(file.type).toBe("image/jpeg");
    expect(file.extension).toBe("jpg");
  });

  it("throws when no file is present in form data", async () => {
    const formData = new FormData();
    formData.append("text", "not a file");
    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: formData,
    });

    await expect(parseRequest(request)).rejects.toThrow("No file found");
  });

  it("extracts extension from filename", async () => {
    const request = createMockFormDataRequest({
      name: "document.report.pdf",
      type: "application/pdf",
      content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    });

    const file = await parseRequest(request);
    expect(file.extension).toBe("pdf");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/parse.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `packages/storage/src/parse.ts`:

```typescript
export type ParsedFile = {
  name: string;
  extension: string;
  type: string;
  size: number;
  stream: ReadableStream<Uint8Array>;
};

export async function parseRequest(request: Request): Promise<ParsedFile> {
  const formData = await request.formData();

  // Find the first File entry
  let file: File | null = null;
  for (const [, value] of formData) {
    if (value instanceof File) {
      file = value;
      break;
    }
  }

  if (!file) {
    throw new Error("No file found in request form data");
  }

  const name = file.name;
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? name.slice(dotIndex + 1) : "";

  return {
    name,
    extension,
    type: file.type,
    size: file.size,
    stream: file.stream(),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/parse.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/storage/src/parse.ts packages/storage/src/__tests__/parse.test.ts packages/storage/src/__tests__/helpers.ts
git commit -m "feat(storage): request parsing — extract file from multipart form data"
```

---

### Task 6: Upload Pipeline (Direct PUT + Multipart)

**Files:**
- Create: `packages/storage/src/upload.ts`
- Create: `packages/storage/src/__tests__/upload.test.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/upload.test.ts`:

```typescript
import { directPut, multipartUpload, replaceExisting } from "../upload.js";
import { createMockR2Bucket } from "./helpers.js";

describe("directPut", () => {
  it("uploads stream to R2 with correct key and content type", async () => {
    const bucket = createMockR2Bucket();
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const result = await directPut(bucket, "avatars/user1/photo.jpg", stream, "image/jpeg");

    expect(bucket.put).toHaveBeenCalledWith(
      "avatars/user1/photo.jpg",
      expect.anything(),
      { httpMetadata: { contentType: "image/jpeg" } },
    );
    expect(result.key).toBe("avatars/user1/photo.jpg");
  });
});

describe("multipartUpload", () => {
  it("creates multipart upload for large streams", async () => {
    const bucket = createMockR2Bucket();
    // Create a stream with 3 chunks of 10 bytes each (partSize=10)
    const chunk = new Uint8Array(10);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(chunk));
        controller.enqueue(new Uint8Array(chunk));
        controller.enqueue(new Uint8Array(chunk));
        controller.close();
      },
    });

    const result = await multipartUpload(bucket, "docs/big-file.pdf", stream, "application/pdf", {
      partSize: 10,
      concurrency: 1,
    });

    expect(bucket.createMultipartUpload).toHaveBeenCalledWith("docs/big-file.pdf", {
      httpMetadata: { contentType: "application/pdf" },
    });
    expect(result.key).toBe("docs/big-file.pdf");
  });

  it("aborts upload on part failure", async () => {
    const bucket = createMockR2Bucket();
    const mockUpload = {
      key: "test.pdf",
      uploadId: "mock-id",
      uploadPart: vi.fn().mockRejectedValue(new Error("R2 error")),
      complete: vi.fn(),
      abort: vi.fn(),
    };
    vi.mocked(bucket.createMultipartUpload).mockResolvedValue(mockUpload as any);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(100));
        controller.close();
      },
    });

    await expect(
      multipartUpload(bucket, "test.pdf", stream, "application/pdf", { partSize: 10, concurrency: 1 }),
    ).rejects.toThrow();

    expect(mockUpload.abort).toHaveBeenCalled();
  });
});

describe("replaceExisting", () => {
  it("deletes objects matching prefix", async () => {
    const bucket = createMockR2Bucket({
      listResult: {
        objects: [
          { key: "avatars/user1/old-photo.jpg" } as R2Object,
          { key: "avatars/user1/older-photo.png" } as R2Object,
        ],
        truncated: false,
      } as R2Objects,
    });

    await replaceExisting(bucket, "avatars/user1/");

    expect(bucket.list).toHaveBeenCalledWith({ prefix: "avatars/user1/" });
    expect(bucket.delete).toHaveBeenCalledWith([
      "avatars/user1/old-photo.jpg",
      "avatars/user1/older-photo.png",
    ]);
  });

  it("skips delete when no existing objects", async () => {
    const bucket = createMockR2Bucket({
      listResult: { objects: [], truncated: false } as R2Objects,
    });

    await replaceExisting(bucket, "avatars/user2/");

    expect(bucket.delete).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/upload.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `packages/storage/src/upload.ts`:

```typescript
import { StorageError } from "./errors.js";

export type UploadedObject = {
  key: string;
};

export async function directPut(
  bucket: R2Bucket,
  key: string,
  stream: ReadableStream<Uint8Array>,
  contentType: string,
): Promise<UploadedObject> {
  await bucket.put(key, stream, {
    httpMetadata: { contentType },
  });

  return { key };
}

export async function multipartUpload(
  bucket: R2Bucket,
  key: string,
  stream: ReadableStream<Uint8Array>,
  contentType: string,
  options: { partSize: number; concurrency: number },
): Promise<UploadedObject> {
  const upload = await bucket.createMultipartUpload(key, {
    httpMetadata: { contentType },
  });

  try {
    const parts = await uploadParts(upload, stream, options);
    await upload.complete(parts);
    return { key };
  } catch (e) {
    await upload.abort();
    throw new StorageError({
      code: "UPLOAD_FAILED",
      detail: `Multipart upload failed: ${e instanceof Error ? e.message : String(e)}`,
      status: 500,
    });
  }
}

async function uploadParts(
  upload: R2MultipartUpload,
  stream: ReadableStream<Uint8Array>,
  options: { partSize: number; concurrency: number },
): Promise<R2UploadedPart[]> {
  const reader = stream.getReader();
  const parts: R2UploadedPart[] = [];
  let partNumber = 1;
  let buffer = new Uint8Array(0);

  // Collect parts from stream
  const partBuffers: Uint8Array[] = [];

  while (true) {
    const { value, done } = await reader.read();

    if (value) {
      // Append to buffer
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;
    }

    // Flush complete parts
    while (buffer.length >= options.partSize) {
      partBuffers.push(buffer.slice(0, options.partSize));
      buffer = buffer.slice(options.partSize);
    }

    if (done) {
      // Flush remaining buffer as final part
      if (buffer.length > 0) {
        partBuffers.push(buffer);
      }
      break;
    }
  }

  // Upload parts with concurrency limit
  const pending: Promise<void>[] = [];

  for (const partData of partBuffers) {
    const pn = partNumber++;

    const uploadPromise = (async () => {
      const part = await upload.uploadPart(pn, partData);
      parts.push(part);
    })();

    pending.push(uploadPromise);

    if (pending.length >= options.concurrency) {
      await Promise.race(pending);
      // Remove resolved promises
      const settled = await Promise.allSettled(pending);
      const failed = settled.find((s) => s.status === "rejected");
      if (failed && failed.status === "rejected") {
        throw failed.reason;
      }
      pending.length = 0;
      // Re-add still-pending ones — simplified: just await all
    }
  }

  // Wait for remaining
  await Promise.all(pending);

  // Sort parts by number (R2 requires ordered parts)
  parts.sort((a, b) => a.partNumber - b.partNumber);

  return parts;
}

export async function replaceExisting(
  bucket: R2Bucket,
  prefix: string,
): Promise<void> {
  const listed = await bucket.list({ prefix });

  if (listed.objects.length === 0) return;

  const keys = listed.objects.map((obj) => obj.key);
  await bucket.delete(keys);
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/upload.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/storage/src/upload.ts packages/storage/src/__tests__/upload.test.ts
git commit -m "feat(storage): upload pipeline with direct PUT and multipart support"
```

---

### Task 7: Serve and Signed URLs

**Files:**
- Create: `packages/storage/src/serve.ts`
- Create: `packages/storage/src/__tests__/serve.test.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/serve.test.ts`:

```typescript
import { serveFile, getPublicUrl, createSignedUrl, verifySignedUrl } from "../serve.js";
import { createMockR2Bucket } from "./helpers.js";

describe("serveFile", () => {
  it("returns a Response with the R2 object body", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("file content"));
        controller.close();
      },
    });

    const bucket = createMockR2Bucket({
      getResult: {
        body,
        httpMetadata: { contentType: "image/jpeg" },
        size: 12,
        key: "avatars/photo.jpg",
        writeHttpMetadata: vi.fn((headers: Headers) => {
          headers.set("content-type", "image/jpeg");
        }),
      } as unknown as R2ObjectBody,
    });

    const response = await serveFile(bucket, "avatars/photo.jpg");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe("12");
  });

  it("returns 404 when object not found", async () => {
    const bucket = createMockR2Bucket({ getResult: null });

    const response = await serveFile(bucket, "missing-key");
    expect(response.status).toBe(404);
  });

  it("merges custom headers", async () => {
    const body = new ReadableStream({
      start(controller) { controller.close(); },
    });

    const bucket = createMockR2Bucket({
      getResult: {
        body,
        httpMetadata: {},
        size: 0,
        key: "test.jpg",
        writeHttpMetadata: vi.fn(),
      } as unknown as R2ObjectBody,
    });

    const response = await serveFile(bucket, "test.jpg", {
      "Cache-Control": "public, max-age=31536000",
    });

    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000");
  });
});

describe("getPublicUrl", () => {
  it("constructs URL from base and key", () => {
    const url = getPublicUrl("https://cdn.example.com", "posts/123/photo.jpg");
    expect(url).toBe("https://cdn.example.com/posts/123/photo.jpg");
  });

  it("handles trailing slash on base URL", () => {
    const url = getPublicUrl("https://cdn.example.com/", "posts/photo.jpg");
    expect(url).toBe("https://cdn.example.com/posts/photo.jpg");
  });
});

describe("signed URLs", () => {
  const secret = "test-secret-key-for-hmac";

  it("creates and verifies a signed URL", async () => {
    const url = await createSignedUrl("posts", "posts/123/photo.jpg", secret, "1h");

    expect(url).toContain("posts/123/photo.jpg");
    expect(url).toContain("expires=");
    expect(url).toContain("sig=");

    const isValid = await verifySignedUrl(url, secret);
    expect(isValid).toBe(true);
  });

  it("rejects expired signed URLs", async () => {
    // Create URL that expired 1 hour ago
    const url = await createSignedUrl("posts", "posts/123/photo.jpg", secret, "-1h");

    const isValid = await verifySignedUrl(url, secret);
    expect(isValid).toBe(false);
  });

  it("rejects tampered URLs", async () => {
    const url = await createSignedUrl("posts", "posts/123/photo.jpg", secret, "1h");

    // Tamper with the key
    const tampered = url.replace("photo.jpg", "other.jpg");

    const isValid = await verifySignedUrl(tampered, secret);
    expect(isValid).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/serve.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `packages/storage/src/serve.ts`:

```typescript
import { parseSize } from "./schema.js";

export async function serveFile(
  bucket: R2Bucket,
  key: string,
  headers?: Record<string, string>,
): Promise<Response> {
  const object = await bucket.get(key);

  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const responseHeaders = new Headers();
  object.writeHttpMetadata(responseHeaders);
  responseHeaders.set("content-length", String(object.size));

  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      responseHeaders.set(k, v);
    }
  }

  return new Response(object.body, { headers: responseHeaders });
}

export function getPublicUrl(baseUrl: string, key: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}/${key}`;
}

const DURATION_UNITS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function parseDuration(duration: string): number {
  const match = duration.match(/^(-?\d+(?:\.\d+)?)\s*(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Expected format: "1h", "30m", "7d", etc.`);
  }
  return parseFloat(match[1]) * DURATION_UNITS[match[2]];
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

export async function createSignedUrl(
  name: string,
  key: string,
  secret: string,
  expiresIn: string,
): Promise<string> {
  const durationMs = parseDuration(expiresIn);
  const expires = Math.floor((Date.now() + durationMs) / 1000);

  const payload = `${name}/${key}:${expires}`;
  const sig = await hmacSign(payload, secret);

  return `/storage/${name}/${key}?expires=${expires}&sig=${sig}`;
}

export async function verifySignedUrl(url: string, secret: string): Promise<boolean> {
  // Parse the URL — handle both full URLs and path-only
  let pathname: string;
  let searchParams: URLSearchParams;

  try {
    const parsed = new URL(url, "http://localhost");
    pathname = parsed.pathname;
    searchParams = parsed.searchParams;
  } catch {
    return false;
  }

  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");

  if (!expires || !sig) return false;

  // Check expiry
  const expiresNum = parseInt(expires, 10);
  if (isNaN(expiresNum)) return false;
  if (expiresNum < Math.floor(Date.now() / 1000)) return false;

  // Extract name and key from pathname: /storage/{name}/{key}
  const match = pathname.match(/^\/storage\/([^/]+)\/(.+)$/);
  if (!match) return false;

  const [, name, key] = match;
  const payload = `${name}/${key}:${expires}`;

  return hmacVerify(payload, sig, secret);
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/serve.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/storage/src/serve.ts packages/storage/src/__tests__/serve.test.ts
git commit -m "feat(storage): file serving and HMAC signed URLs"
```

---

### Task 8: Handle Orchestrator and `defineStorage()`

**Files:**
- Create: `packages/storage/src/handle.ts`
- Create: `packages/storage/src/__tests__/handle.test.ts`
- Modify: `packages/storage/src/schema.ts` (add `defineStorage`)

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/handle.test.ts`:

```typescript
import { defineStorage, filetype } from "../schema.js";
import { StorageError } from "../errors.js";
import { createMockR2Bucket, createMockFormDataRequest } from "./helpers.js";

describe("defineStorage", () => {
  const schema = {
    avatars: filetype({
      bucket: "UPLOADS",
      accept: ["image/jpeg", "image/png"] as const,
      maxSize: "2mb",
      key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
      replace: true,
    }),
    documents: filetype({
      bucket: "DOCUMENTS",
      accept: ["application/pdf"] as const,
      maxSize: "50mb",
      key: (file) => `docs/${file.name}`,
      publicUrl: "https://cdn.example.com",
    }),
  };

  it("returns an object with handle, serve, getPublicUrl, getSignedUrl, verifySignedUrl, clientConfig", () => {
    const storage = defineStorage(schema);

    expect(typeof storage.handle).toBe("function");
    expect(typeof storage.serve).toBe("function");
    expect(typeof storage.getPublicUrl).toBe("function");
    expect(typeof storage.getSignedUrl).toBe("function");
    expect(typeof storage.verifySignedUrl).toBe("function");
    expect(typeof storage.clientConfig).toBe("function");
  });

  describe("clientConfig", () => {
    it("returns client-safe config for all filetypes", () => {
      const storage = defineStorage(schema);
      const config = storage.clientConfig();

      expect(config.avatars).toEqual({
        accept: ["image/jpeg", "image/png"],
        maxSize: "2mb",
        maxSizeBytes: 2 * 1024 * 1024,
      });

      expect(config.documents).toEqual({
        accept: ["application/pdf"],
        maxSize: "50mb",
        maxSizeBytes: 50 * 1024 * 1024,
      });
    });
  });

  describe("getPublicUrl", () => {
    it("returns the public URL for a key", () => {
      const storage = defineStorage(schema);
      const url = storage.getPublicUrl("documents", "docs/report.pdf");
      expect(url).toBe("https://cdn.example.com/docs/report.pdf");
    });

    it("throws when filetype has no publicUrl", () => {
      const storage = defineStorage(schema);
      expect(() => storage.getPublicUrl("avatars", "test")).toThrow("publicUrl");
    });
  });

  describe("handle", () => {
    it("uploads a valid file", async () => {
      const storage = defineStorage(schema);
      // JPEG magic bytes + some data
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0x00),
      ]);

      const request = createMockFormDataRequest({
        name: "photo.jpg",
        type: "image/jpeg",
        content: jpegData,
      });

      const bucket = createMockR2Bucket();
      const result = await storage.handle("avatars", request, {
        env: { UPLOADS: bucket },
        user: { id: "user-1" },
      });

      expect(result.key).toBe("avatars/user-1/photo.jpg");
      expect(result.type).toBe("image/jpeg");
      expect(bucket.put).toHaveBeenCalled();
    });

    it("rejects invalid MIME type", async () => {
      const storage = defineStorage(schema);
      const request = createMockFormDataRequest({
        name: "doc.txt",
        type: "text/plain",
        content: new Uint8Array([0x01, 0x02]),
      });

      const bucket = createMockR2Bucket();
      await expect(
        storage.handle("avatars", request, {
          env: { UPLOADS: bucket },
          user: { id: "user-1" },
        }),
      ).rejects.toThrow(StorageError);
    });

    it("calls replace when replace is true", async () => {
      const storage = defineStorage(schema);
      const jpegData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0x00),
      ]);
      const request = createMockFormDataRequest({
        name: "photo.jpg",
        type: "image/jpeg",
        content: jpegData,
      });

      const bucket = createMockR2Bucket({
        listResult: {
          objects: [{ key: "avatars/user-1/old.jpg" } as R2Object],
          truncated: false,
        } as R2Objects,
      });

      await storage.handle("avatars", request, {
        env: { UPLOADS: bucket },
        user: { id: "user-1" },
      });

      expect(bucket.list).toHaveBeenCalled();
      expect(bucket.delete).toHaveBeenCalledWith(["avatars/user-1/old.jpg"]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/handle.test.ts`
Expected: FAIL

**Step 3: Write handle orchestrator**

Create `packages/storage/src/handle.ts`:

```typescript
import type { FiletypeConfig, HandleContext, UploadResult } from "./types.js";
import { parseSize } from "./schema.js";
import { parseRequest } from "./parse.js";
import { validateContentType, validateContentLength, validateMagicBytes, createByteCountingStream } from "./validation.js";
import { directPut, multipartUpload, replaceExisting } from "./upload.js";

export async function handleUpload<TInput>(
  config: FiletypeConfig<TInput>,
  request: Request,
  ctx: HandleContext<TInput>,
): Promise<UploadResult> {
  const maxSizeBytes = parseSize(config.maxSize);
  const multipartThreshold = parseSize(config.multipartThreshold ?? "5mb");
  const partSizeBytes = parseSize(config.partSize ?? "10mb");

  // 1. Parse the file from the request
  const parsed = await parseRequest(request);

  // 2. Validate content type from file metadata
  validateContentType(parsed.type, config.accept);

  // 3. Validate content length if known
  validateContentLength(parsed.size > 0 ? parsed.size : null, maxSizeBytes);

  // 4. Validate magic bytes
  const { stream: validatedStream } = await validateMagicBytes(parsed.stream, config.accept);

  // 5. Wrap with byte counting
  const { stream: countedStream, getByteCount } = createByteCountingStream(validatedStream, maxSizeBytes);

  // 6. Generate key
  const keyCtx = { user: ctx.user, input: ctx.input ?? ({} as TInput) };
  const key = config.key({ name: parsed.name, extension: parsed.extension }, keyCtx);

  // 7. Run beforeUpload hook
  if (config.hooks?.beforeUpload) {
    await config.hooks.beforeUpload(
      { name: parsed.name, extension: parsed.extension, type: parsed.type, size: parsed.size },
      ctx,
    );
  }

  // 8. Get the bucket from env
  const bucket = (ctx.env as Record<string, R2Bucket>)[config.bucket];
  if (!bucket) {
    throw new Error(`R2 bucket binding "${config.bucket}" not found in env`);
  }

  // 9. Replace existing files if configured
  if (config.replace) {
    // Extract the directory prefix from the key
    const lastSlash = key.lastIndexOf("/");
    if (lastSlash >= 0) {
      const prefix = key.slice(0, lastSlash + 1);
      await replaceExisting(bucket, prefix);
    }
  }

  // 10. Upload — choose strategy based on file size
  const useMultipart = parsed.size > 0 && parsed.size > multipartThreshold;

  if (useMultipart) {
    await multipartUpload(bucket, key, countedStream, parsed.type, {
      partSize: partSizeBytes,
      concurrency: 3,
    });
  } else {
    await directPut(bucket, key, countedStream, parsed.type);
  }

  const result: UploadResult = {
    key,
    size: getByteCount(),
    type: parsed.type,
  };

  // 11. Run afterUpload hook
  if (config.hooks?.afterUpload) {
    await config.hooks.afterUpload(result, ctx);
  }

  return result;
}
```

**Step 4: Add `defineStorage` to schema.ts**

Add to the bottom of `packages/storage/src/schema.ts`:

```typescript
import type { StorageSchema, StorageInstance, ClientStorageConfig, HandleContext, SignedUrlOptions, ServeOptions } from "./types.js";
import { handleUpload } from "./handle.js";
import { serveFile, getPublicUrl as getPublicUrlFn, createSignedUrl, verifySignedUrl as verifySignedUrlFn } from "./serve.js";

export function defineStorage<T extends StorageSchema>(schema: T): StorageInstance<T> {
  return {
    schema,

    handle: async (name, request, ctx) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      if (config.uploadable === false) throw new Error(`Filetype "${String(name)}" is not uploadable`);
      return handleUpload(config, request, ctx as HandleContext<any>);
    },

    serve: async (name, key, options) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      const bucket = (options.env as Record<string, R2Bucket>)[config.bucket];
      if (!bucket) throw new Error(`R2 bucket binding "${config.bucket}" not found in env`);
      return serveFile(bucket, key, options.headers);
    },

    getPublicUrl: (name, key) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      if (!config.publicUrl) throw new Error(`Filetype "${String(name)}" has no publicUrl configured`);
      return getPublicUrlFn(config.publicUrl, key);
    },

    getSignedUrl: async (name, key, options) => {
      const config = schema[name];
      if (!config) throw new Error(`Unknown filetype: "${String(name)}"`);
      const secret = (options.env as Record<string, string>)["STORAGE_SECRET"];
      if (!secret) throw new Error("STORAGE_SECRET binding not found in env");
      return createSignedUrl(String(name), key, secret, options.expiresIn);
    },

    verifySignedUrl: async (url, options) => {
      const secret = (options.env as Record<string, string>)["STORAGE_SECRET"];
      if (!secret) throw new Error("STORAGE_SECRET binding not found in env");
      return verifySignedUrlFn(url, secret);
    },

    clientConfig: (): ClientStorageConfig => {
      const config: ClientStorageConfig = {};
      for (const [name, ft] of Object.entries(schema)) {
        config[name] = {
          accept: ft.accept,
          maxSize: ft.maxSize,
          maxSizeBytes: parseSize(ft.maxSize),
        };
      }
      return config;
    },
  };
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/handle.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/storage/src/handle.ts packages/storage/src/schema.ts packages/storage/src/__tests__/handle.test.ts
git commit -m "feat(storage): handle orchestrator and defineStorage composition"
```

---

### Task 9: Public API Exports

**Files:**
- Modify: `packages/storage/src/index.ts`

**Step 1: Update index.ts**

Replace `packages/storage/src/index.ts`:

```typescript
export { defineStorage, filetype, parseSize } from "./schema.js";
export { StorageError } from "./errors.js";
export type {
  FiletypeConfig,
  FiletypeHooks,
  StorageSchema,
  StorageInstance,
  StorageErrorCode,
  StorageErrorOptions,
  HandleContext,
  KeyContext,
  FileInfo,
  UploadResult,
  ClientFiletypeConfig,
  ClientStorageConfig,
  SignedUrlOptions,
  ServeOptions,
} from "./types.js";
```

**Step 2: Verify build**

Run: `cd packages/storage && npx tsup src/index.ts src/client.ts --format esm --dts`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/storage/src/index.ts
git commit -m "feat(storage): public API exports for server entrypoint"
```

---

### Task 10: Client Hook — `useUpload` and `StorageProvider`

**Files:**
- Create: `packages/storage/src/client/storage-provider.tsx`
- Create: `packages/storage/src/client/use-upload.ts`
- Modify: `packages/storage/src/client.ts`
- Create: `packages/storage/src/__tests__/client.test.ts`

**Step 1: Write the failing test**

Create `packages/storage/src/__tests__/client.test.ts`:

```typescript
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { StorageProvider, useUpload } from "../client.js";
import type { ClientStorageConfig } from "../types.js";

const mockConfig: ClientStorageConfig = {
  avatars: {
    accept: ["image/jpeg", "image/png"],
    maxSize: "2mb",
    maxSizeBytes: 2 * 1024 * 1024,
  },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(StorageProvider, { config: mockConfig }, children);
}

describe("useUpload", () => {
  it("provides accept string from config", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });
    expect(result.current.accept).toBe("image/jpeg,image/png");
  });

  it("starts with idle state", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.validationError).toBeNull();
  });

  it("validates file size client-side", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });

    const largeFile = new File([new ArrayBuffer(3 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });

    act(() => {
      result.current.start(largeFile);
    });

    expect(result.current.validationError).toContain("2");
    expect(result.current.isUploading).toBe(false);
  });

  it("validates MIME type client-side", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });

    const wrongType = new File([new ArrayBuffer(100)], "doc.txt", {
      type: "text/plain",
    });

    act(() => {
      result.current.start(wrongType);
    });

    expect(result.current.validationError).toContain("text/plain");
    expect(result.current.isUploading).toBe(false);
  });

  it("resets state", () => {
    const { result } = renderHook(() => useUpload("avatars"), { wrapper });

    const wrongType = new File([new ArrayBuffer(100)], "doc.txt", {
      type: "text/plain",
    });

    act(() => {
      result.current.start(wrongType);
    });
    expect(result.current.validationError).not.toBeNull();

    act(() => {
      result.current.reset();
    });
    expect(result.current.validationError).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/storage && npx vitest run src/__tests__/client.test.ts`
Expected: FAIL

**Step 3: Add dev dependencies for React and testing**

Run:
```bash
cd packages/storage && pnpm add -D react @types/react @testing-library/react jsdom
```

Update `packages/storage/vitest.config.ts` (if needed, add jsdom environment):

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    environment: "jsdom",
  },
});
```

Note: The jsdom environment is needed only for client tests. If this causes issues with R2 types in server tests, the tests can be split into separate vitest configs. Start with jsdom globally and adjust if needed.

**Step 4: Write StorageProvider**

Create `packages/storage/src/client/storage-provider.tsx`:

```typescript
import { createContext, useContext } from "react";
import type { ClientStorageConfig } from "../types.js";

const StorageContext = createContext<ClientStorageConfig | null>(null);

export function StorageProvider({
  config,
  children,
}: {
  config: ClientStorageConfig;
  children: React.ReactNode;
}) {
  return <StorageContext.Provider value={config}>{children}</StorageContext.Provider>;
}

export function useStorageConfig(): ClientStorageConfig {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useUpload must be used within a <StorageProvider>");
  }
  return ctx;
}
```

**Step 5: Write useUpload hook**

Create `packages/storage/src/client/use-upload.ts`:

```typescript
import { useState, useCallback } from "react";
import { useStorageConfig } from "./storage-provider.js";
import type { UploadResult } from "../types.js";

export type UploadHookResult = {
  accept: string;
  start: (file: File) => void;
  progress: number;
  isUploading: boolean;
  result: UploadResult | null;
  error: string | null;
  validationError: string | null;
  reset: () => void;
};

export function useUpload(name: string): UploadHookResult {
  const config = useStorageConfig();
  const filetype = config[name];

  if (!filetype) {
    throw new Error(`Unknown filetype: "${name}". Available: ${Object.keys(config).join(", ")}`);
  }

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const accept = filetype.accept.join(",");

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setResult(null);
    setError(null);
    setValidationError(null);
  }, []);

  const start = useCallback(
    (file: File) => {
      // Reset previous state
      setValidationError(null);
      setError(null);
      setResult(null);

      // Client-side validation: MIME type
      if (!filetype.accept.includes(file.type)) {
        setValidationError(
          `${file.type} is not accepted. Allowed: ${filetype.accept.join(", ")}`,
        );
        return;
      }

      // Client-side validation: file size
      if (file.size > filetype.maxSizeBytes) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const maxMB = (filetype.maxSizeBytes / (1024 * 1024)).toFixed(1);
        setValidationError(`File is ${sizeMB}MB but max is ${maxMB}MB`);
        return;
      }

      // Upload via XHR for progress tracking
      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setResult(data);
            setProgress(100);
          } catch {
            setError("Invalid response from server");
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.detail ?? data.message ?? `Upload failed (${xhr.status})`);
          } catch {
            setError(`Upload failed (${xhr.status})`);
          }
        }
      });

      xhr.addEventListener("error", () => {
        setIsUploading(false);
        setError("Network error during upload");
      });

      xhr.open("POST", window.location.pathname);
      xhr.send(formData);
    },
    [filetype],
  );

  return {
    accept,
    start,
    progress,
    isUploading,
    result,
    error,
    validationError,
    reset,
  };
}
```

**Step 6: Update client.ts entrypoint**

Replace `packages/storage/src/client.ts`:

```typescript
export { StorageProvider } from "./client/storage-provider.js";
export { useUpload } from "./client/use-upload.js";
export type { UploadHookResult } from "./client/use-upload.js";
export type { ClientStorageConfig, ClientFiletypeConfig } from "./types.js";
```

**Step 7: Run test to verify it passes**

Run: `cd packages/storage && npx vitest run src/__tests__/client.test.ts`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/storage/src/client.ts packages/storage/src/client/ packages/storage/src/__tests__/client.test.ts packages/storage/vitest.config.ts packages/storage/package.json
git commit -m "feat(storage): useUpload client hook with StorageProvider"
```

---

### Task 11: Add vitest and tsconfig for JSX, verify full build

**Files:**
- Modify: `packages/storage/tsconfig.json` (add JSX support)
- Modify: `packages/storage/package.json` (add test script, react peer dep)

**Step 1: Update tsconfig.json**

Add `"jsx": "react-jsx"` to compilerOptions in `packages/storage/tsconfig.json`.

**Step 2: Add react as peer dependency and vitest as dev dependency**

```bash
cd packages/storage
# Add react as peer dep (edit package.json manually)
# Add vitest as dev dep
pnpm add -D vitest
```

Add to package.json peerDependencies: `"react": ">=18"`

Add to scripts: `"test": "vitest run"`

**Step 3: Run full test suite**

Run: `cd packages/storage && npx vitest run`
Expected: All tests pass

**Step 4: Run full build**

Run: `cd packages/storage && pnpm build`
Expected: Build succeeds with both server and client entrypoints

**Step 5: Commit**

```bash
git add packages/storage/tsconfig.json packages/storage/package.json pnpm-lock.yaml
git commit -m "chore(storage): configure JSX, vitest, and peer dependencies"
```

---

### Task 12: Run all quality checks

**Step 1: Typecheck**

Run: `cd packages/storage && pnpm typecheck`
Expected: No type errors

**Step 2: Full monorepo build**

Run: `pnpm build`
Expected: All packages build successfully

**Step 3: All storage tests**

Run: `cd packages/storage && npx vitest run`
Expected: All tests pass

**Step 4: Fix any issues found, commit**

**Step 5: Final commit — update README if implementation diverged**

Review `packages/storage/README.md` against actual implementation. Update any API signatures that changed during implementation.

```bash
git add packages/storage/README.md
git commit -m "docs(storage): update README to match implemented API"
```
