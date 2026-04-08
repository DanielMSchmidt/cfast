/**
 * Machine-readable error codes produced by the storage validation and upload pipeline.
 *
 * - `"FILE_TOO_LARGE"` — The file exceeds the configured `maxSize` (HTTP 413).
 * - `"INVALID_MIME_TYPE"` — The file's MIME type is not in the `accept` list (HTTP 415).
 * - `"UPLOAD_FAILED"` — The R2 upload operation failed (HTTP 500).
 * - `"UNAUTHORIZED"` — The caller failed the `ownerCheck` access gate (HTTP 403).
 * - `"INVALID_TOKEN"` — A signed URL token is missing, malformed, or expired (HTTP 403).
 */
export type StorageErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_MIME_TYPE"
  | "UPLOAD_FAILED"
  | "UNAUTHORIZED"
  | "INVALID_TOKEN";

/**
 * Options used to construct a {@link StorageError}.
 *
 * Combines a machine-readable code, human-readable detail, and an HTTP status
 * code so that errors can be surfaced directly in API responses.
 */
export type StorageErrorOptions = {
  /** Machine-readable error code. */
  code: StorageErrorCode;
  /** Human-readable description of the problem. */
  detail: string;
  /** HTTP status code to surface to the client (e.g. 413, 415, 500). */
  status: number;
};

/**
 * A group of MIME types sharing a single size limit, used by the per-mime
 * form of {@link filetype}. Each group independently enforces its `maxSize`
 * so you can allow (for example) 10 MB images and 50 MB PDFs in the same
 * filetype without raising the ceiling for images to 50 MB.
 */
export type MimeGroup = {
  /** MIME types belonging to this group (e.g. `["image/jpeg", "image/png"]`). */
  mimes: readonly string[];
  /** Maximum file size for this group as a human-readable string (e.g. `"10mb"`). */
  maxSize: string;
};

/**
 * A record of named MIME groups. Passed as the first argument to the
 * per-mime form of {@link filetype}.
 *
 * @example
 * ```ts
 * filetype({
 *   image: { mimes: ["image/jpeg", "image/png"], maxSize: "10mb" },
 *   document: { mimes: ["application/pdf"], maxSize: "50mb" },
 * }, { bucket: "UPLOADS", key: (file, ctx) => `files/${file.name}` });
 * ```
 */
export type MimeGroupsRecord = Record<string, MimeGroup>;

/**
 * Normalized MIME group used internally by validation. Same as {@link MimeGroup}
 * but with `maxSize` pre-parsed to bytes for efficient runtime checks.
 */
export type NormalizedMimeGroup = {
  /** MIME types belonging to this group. */
  mimes: readonly string[];
  /** Original human-readable max size string. */
  maxSize: string;
  /** Max size in bytes (pre-parsed from `maxSize`). */
  maxSizeBytes: number;
};

/**
 * Options for the per-mime form of {@link filetype} — all the fields you'd
 * set on a {@link FiletypeConfig} except `accept` and `maxSize`, which are
 * derived from the MIME groups.
 */
export type MimeGroupedFiletypeOptions<TInput = Record<string, unknown>> = {
  /** R2 binding name from the Workers environment (e.g. `"UPLOADS"`). */
  bucket: string;
  /** Function that generates the R2 object key for an uploaded file. */
  key: (file: { name: string; extension: string }, ctx: KeyContext<TInput>) => string;
  /** When `true`, uploading replaces all existing files under the same key prefix. */
  replace?: boolean;
  /** When `false`, the file type cannot be uploaded directly (e.g. system-generated exports). */
  uploadable?: boolean;
  /** File size above which multipart upload is used (default `"5mb"`). */
  multipartThreshold?: string;
  /** Size of each part in a multipart upload (default `"10mb"`). */
  partSize?: string;
  /** Base URL for publicly accessible files (used by `getPublicUrl`). */
  publicUrl?: string;
  /** Lifecycle hooks that run before and after upload. */
  hooks?: FiletypeHooks<TInput>;
  /** Access-control gate used by the `/uploads/*` proxy route. */
  ownerCheck?: OwnerCheck;
};

/**
 * Access-control gate evaluated by the opinionated `/uploads/*` proxy route
 * before streaming a private R2 object. Return `true` to allow access,
 * `false` to respond with HTTP 403.
 *
 * @param key - The R2 object key being requested (from `params["*"]`).
 * @param user - The authenticated user returned by `requireUser`, or `null` if
 *   the route was configured without a `requireUser` callback.
 * @param env - The Workers environment, so the implementation can reach its
 *   database bindings.
 */
export type OwnerCheck = (
  key: string,
  user: { id: string; [k: string]: unknown } | null,
  env: Record<string, unknown>,
) => Promise<boolean> | boolean;

/**
 * Configuration for a single file type within a storage schema.
 *
 * Defines the R2 bucket, accepted MIME types, size limits, key generation
 * strategy, and optional lifecycle hooks for a category of files.
 *
 * @typeParam TInput - The shape of caller-provided input available in the `key` function and hooks.
 *
 * @example
 * ```ts
 * import { filetype } from "@cfast/storage";
 *
 * const avatars = filetype({
 *   bucket: "UPLOADS",
 *   accept: ["image/jpeg", "image/png", "image/webp"],
 *   maxSize: "2mb",
 *   key: (file, ctx) => `avatars/${ctx.user.id}/${file.name}`,
 *   replace: true,
 * });
 * ```
 */
export type FiletypeConfig<TInput = Record<string, unknown>> = {
  /** R2 binding name from the Workers environment (e.g. `"UPLOADS"`). */
  bucket: string;
  /** MIME types accepted for this file type (e.g. `["image/jpeg", "image/png"]`). */
  accept: readonly string[];
  /** Maximum file size as a human-readable string (e.g. `"10mb"`, `"500kb"`). */
  maxSize: string;
  /** Function that generates the R2 object key for an uploaded file. */
  key: (file: { name: string; extension: string }, ctx: KeyContext<TInput>) => string;
  /** When `true`, uploading replaces all existing files under the same key prefix. */
  replace?: boolean;
  /** When `false`, the file type cannot be uploaded directly (e.g. system-generated exports). */
  uploadable?: boolean;
  /** File size above which multipart upload is used (default `"5mb"`). */
  multipartThreshold?: string;
  /** Size of each part in a multipart upload (default `"10mb"`). */
  partSize?: string;
  /** Base URL for publicly accessible files (used by `getPublicUrl`). */
  publicUrl?: string;
  /** Lifecycle hooks that run before and after upload. */
  hooks?: FiletypeHooks<TInput>;
  /**
   * Optional per-mime-group size limits. When set, each mime group's
   * `maxSize` is enforced independently — a file whose mime type belongs
   * to a given group must fit within that group's limit.
   *
   * Populated automatically when using the per-mime form of {@link filetype}.
   */
  mimeGroups?: readonly NormalizedMimeGroup[];
  /**
   * Optional access-control gate evaluated by the `/uploads/*` proxy route
   * before streaming a private R2 object. See {@link OwnerCheck}.
   */
  ownerCheck?: OwnerCheck;
};

/**
 * Lifecycle hooks for a file type, invoked during the upload pipeline.
 *
 * Use `beforeUpload` for pre-processing (e.g. quota checks, image resizing)
 * and `afterUpload` for post-processing (e.g. saving to the database,
 * triggering a queue).
 *
 * @typeParam TInput - The shape of caller-provided input available in the hook context.
 */
export type FiletypeHooks<TInput = Record<string, unknown>> = {
  /** Called after validation but before bytes are written to R2. */
  beforeUpload?: (file: FileInfo, ctx: HandleContext<TInput>) => Promise<void>;
  /** Called after a successful upload completes. */
  afterUpload?: (result: UploadResult, ctx: HandleContext<TInput>) => Promise<void>;
};

/**
 * Context passed to the `key` function when generating an R2 object key.
 *
 * @typeParam TInput - The shape of caller-provided input data.
 */
export type KeyContext<TInput = Record<string, unknown>> = {
  /** The authenticated user performing the upload. */
  user: { id: string; [key: string]: unknown };
  /** Caller-provided input data (e.g. a `postId`). */
  input: TInput;
};

/**
 * Context required by the upload handler and lifecycle hooks.
 *
 * Passed to {@link StorageInstance.handle} to provide access to env bindings,
 * the authenticated user, and optional caller-provided input.
 *
 * @typeParam TInput - The shape of caller-provided input data.
 */
export type HandleContext<TInput = Record<string, unknown>> = {
  /** Workers environment bindings (must include the target R2 bucket). */
  env: Record<string, unknown>;
  /** The authenticated user performing the upload. */
  user: { id: string; [key: string]: unknown };
  /** Optional caller-provided input available in the `key` function and hooks. */
  input?: TInput;
};

/**
 * Metadata about a file extracted from the incoming multipart request.
 *
 * Passed to the `beforeUpload` hook with the file's identity and size
 * before any bytes are written to R2.
 */
export type FileInfo = {
  /** Original file name (e.g. `"photo.jpg"`). */
  name: string;
  /** File extension without the leading dot (e.g. `"jpg"`). */
  extension: string;
  /** MIME type from the file metadata (e.g. `"image/jpeg"`). */
  type: string;
  /** File size in bytes. */
  size: number;
};

/**
 * Result returned after a successful file upload to R2.
 *
 * Contains the R2 object key, the verified byte count, and the MIME type.
 * Passed to the `afterUpload` hook and returned from {@link StorageInstance.handle}.
 */
export type UploadResult = {
  /** The R2 object key where the file was stored. */
  key: string;
  /** Actual file size in bytes (verified via streaming byte count). */
  size: number;
  /** MIME type of the uploaded file. */
  type: string;
};

/**
 * A record mapping file type names to their {@link FiletypeConfig} definitions.
 *
 * Used as the input to {@link defineStorage} to declare the full storage schema.
 *
 * @remarks Uses `any` for the input generic so that heterogeneous file types
 * with different `TInput` shapes can be collected in a single schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal constraint type for schema registration
export type StorageSchema = Record<string, FiletypeConfig<any>>;

/**
 * Client-safe subset of a file type's configuration, used for client-side validation.
 *
 * Contains only the information needed by the `useUpload` hook to validate
 * files before uploading (accepted MIME types and max size). Does not expose
 * bucket names, key functions, or other server-only details.
 */
export type ClientFiletypeConfig = {
  /** MIME types accepted for this file type. */
  accept: readonly string[];
  /** Human-readable maximum size string (e.g. `"10mb"`). */
  maxSize: string;
  /** Maximum size in bytes (pre-parsed for efficient client validation). */
  maxSizeBytes: number;
};

/**
 * A record of client-safe file type configs, keyed by file type name.
 *
 * Passed to the `StorageProvider` to make schema information available to `useUpload`.
 */
export type ClientStorageConfig = Record<string, ClientFiletypeConfig>;

/**
 * Options for generating a time-limited HMAC-signed URL for private file access.
 *
 * Requires a `STORAGE_SECRET` binding in the Workers environment for HMAC signing.
 */
export type SignedUrlOptions = {
  /** Workers environment bindings (must include `STORAGE_SECRET`). */
  env: Record<string, unknown>;
  /** How long the URL is valid (e.g. `"1h"`, `"30m"`, `"7d"`). */
  expiresIn: string;
};

/**
 * Options for serving a file directly from R2 as an HTTP response.
 *
 * The resulting `Response` streams the file body and includes R2 HTTP metadata
 * (content-type, etag, etc.) plus any additional headers you specify.
 */
export type ServeOptions = {
  /** Workers environment bindings (must include the target R2 bucket). */
  env: Record<string, unknown>;
  /** Additional response headers to include (e.g. `Cache-Control`). */
  headers?: Record<string, string>;
};

/**
 * The storage instance returned by {@link defineStorage}, providing upload, serve, and URL methods.
 *
 * All methods are scoped to the declared schema — TypeScript enforces that file type
 * names and input types match the schema definition.
 *
 * @typeParam T - The storage schema type mapping file type names to their configs.
 *
 * @example
 * ```ts
 * const storage = defineStorage({ avatars: filetype({ ... }) });
 *
 * // Upload
 * const result = await storage.handle("avatars", request, { env, user });
 *
 * // Serve
 * const response = await storage.serve("avatars", result.key, { env });
 *
 * // Client config for StorageProvider
 * const config = storage.clientConfig();
 * ```
 */
/**
 * Options for {@link StorageInstance.signedUrl} — the opinionated helper that
 * mints a short, token-bearing URL pointing at the `/uploads/*` proxy route.
 */
export type InstanceSignedUrlOptions = {
  /** Workers environment bindings (must include `STORAGE_SECRET`). */
  env: Record<string, unknown>;
  /** How long the URL is valid (e.g. `"1h"`, `"30m"`, `"7d"`). */
  expiresIn: string;
  /**
   * Base path of the proxy route. Defaults to `"/uploads"`. Override this if
   * you mounted {@link storageRoutes} under a non-default `basePath`.
   */
  basePath?: string;
};

export type StorageInstance<T extends StorageSchema> = {
  /** The raw schema passed to `defineStorage`. */
  schema: T;
  /**
   * Parse, validate, and upload a file to R2.
   *
   * Two forms are supported:
   *
   * 1. `handle(name, request, ctx)` — pass the raw `Request`; the handler
   *    will parse the multipart body itself. Use this when the request body
   *    contains only the file.
   * 2. `handle(name, file, ctx)` — pass a pre-extracted `File` object. Use
   *    this when the request body carries the file alongside structured
   *    fields (e.g. a title) that you need to read too — parse `formData()`
   *    once, then hand the `File` to this overload.
   */
  handle: <K extends keyof T & string>(
    name: K,
    source: Request | File,
    ctx: HandleContext<T[K] extends FiletypeConfig<infer I> ? I : Record<string, unknown>>,
  ) => Promise<UploadResult>;
  /** Stream a file directly from R2, returning a `Response` with appropriate headers. */
  serve: (name: keyof T & string, key: string, options: ServeOptions) => Promise<Response>;
  /** Build a public URL for a file in a public bucket. */
  getPublicUrl: (name: keyof T & string, key: string) => string;
  /** Generate a time-limited HMAC-signed URL for private file access, scoped to a filetype. */
  getSignedUrl: (name: keyof T & string, key: string, options: SignedUrlOptions) => Promise<string>;
  /** Verify that a (filetype-scoped) signed URL has a valid signature and has not expired. */
  verifySignedUrl: (url: string, options: { env: Record<string, unknown> }) => Promise<boolean>;
  /**
   * Mint a short, time-limited URL pointing at the `/uploads/*` proxy route
   * for private file access. The returned path is relative (e.g.
   * `/uploads/products/abc/image.jpg?token=...`) and its token is validated
   * by the proxy route before streaming the underlying R2 object.
   *
   * Unlike {@link getSignedUrl}, this helper is not scoped to a filetype —
   * the token binds the key and expiry only, which is what the opinionated
   * `/uploads/*` proxy route expects.
   */
  signedUrl: (key: string, options: InstanceSignedUrlOptions) => Promise<string>;
  /**
   * Verify a token minted by {@link signedUrl} against a raw R2 object key.
   *
   * @returns `true` when the token is well-formed, unexpired, and the HMAC
   *   matches the key; `false` otherwise.
   */
  verifySignedToken: (
    key: string,
    token: string,
    options: { env: Record<string, unknown> },
  ) => Promise<boolean>;
  /** Extract the client-safe subset of the schema for use with `StorageProvider`. */
  clientConfig: () => ClientStorageConfig;
};
