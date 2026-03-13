/** Error codes produced by the storage validation and upload pipeline. */
export type StorageErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_MIME_TYPE"
  | "UPLOAD_FAILED";

/** Options used to construct a {@link StorageError}. */
export type StorageErrorOptions = {
  /** Machine-readable error code. */
  code: StorageErrorCode;
  /** Human-readable description of the problem. */
  detail: string;
  /** HTTP status code to surface to the client (e.g. 413, 415, 500). */
  status: number;
};

/** Configuration for a single file type within a storage schema. */
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
};

/** Lifecycle hooks for a file type, invoked during the upload pipeline. */
export type FiletypeHooks<TInput = Record<string, unknown>> = {
  /** Called after validation but before bytes are written to R2. */
  beforeUpload?: (file: FileInfo, ctx: HandleContext<TInput>) => Promise<void>;
  /** Called after a successful upload completes. */
  afterUpload?: (result: UploadResult, ctx: HandleContext<TInput>) => Promise<void>;
};

/** Context passed to the `key` function when generating an R2 object key. */
export type KeyContext<TInput = Record<string, unknown>> = {
  /** The authenticated user performing the upload. */
  user: { id: string; [key: string]: unknown };
  /** Caller-provided input data (e.g. a `postId`). */
  input: TInput;
};

/** Context required by the upload handler and lifecycle hooks. */
export type HandleContext<TInput = Record<string, unknown>> = {
  /** Workers environment bindings (must include the target R2 bucket). */
  env: Record<string, unknown>;
  /** The authenticated user performing the upload. */
  user: { id: string; [key: string]: unknown };
  /** Optional caller-provided input available in the `key` function and hooks. */
  input?: TInput;
};

/** Metadata about a file extracted from the incoming request. */
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

/** Result returned after a successful file upload to R2. */
export type UploadResult = {
  /** The R2 object key where the file was stored. */
  key: string;
  /** Actual file size in bytes (verified via streaming byte count). */
  size: number;
  /** MIME type of the uploaded file. */
  type: string;
};

/**
 * A record of named file type configurations, used as the input to {@link defineStorage}.
 *
 * @remarks Uses `any` for the input generic so that heterogeneous file types can be collected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal constraint type for schema registration
export type StorageSchema = Record<string, FiletypeConfig<any>>;

/** Client-safe subset of a file type's configuration, used for client-side validation. */
export type ClientFiletypeConfig = {
  /** MIME types accepted for this file type. */
  accept: readonly string[];
  /** Human-readable maximum size string (e.g. `"10mb"`). */
  maxSize: string;
  /** Maximum size in bytes (pre-parsed for efficient client validation). */
  maxSizeBytes: number;
};

/** A record of client-safe file type configs, keyed by file type name. */
export type ClientStorageConfig = Record<string, ClientFiletypeConfig>;

/** Options for generating a time-limited signed URL. */
export type SignedUrlOptions = {
  /** Workers environment bindings (must include `STORAGE_SECRET`). */
  env: Record<string, unknown>;
  /** How long the URL is valid (e.g. `"1h"`, `"30m"`, `"7d"`). */
  expiresIn: string;
};

/** Options for serving a file directly from R2. */
export type ServeOptions = {
  /** Workers environment bindings (must include the target R2 bucket). */
  env: Record<string, unknown>;
  /** Additional response headers to include (e.g. `Cache-Control`). */
  headers?: Record<string, string>;
};

/** The storage instance returned by {@link defineStorage}, providing upload, serve, and URL methods. */
export type StorageInstance<T extends StorageSchema> = {
  /** The raw schema passed to `defineStorage`. */
  schema: T;
  /** Parse, validate, and upload a file from an incoming request to R2. */
  handle: <K extends keyof T & string>(
    name: K,
    request: Request,
    ctx: HandleContext<T[K] extends FiletypeConfig<infer I> ? I : Record<string, unknown>>,
  ) => Promise<UploadResult>;
  /** Stream a file directly from R2, returning a `Response` with appropriate headers. */
  serve: (name: keyof T & string, key: string, options: ServeOptions) => Promise<Response>;
  /** Build a public URL for a file in a public bucket. */
  getPublicUrl: (name: keyof T & string, key: string) => string;
  /** Generate a time-limited HMAC-signed URL for private file access. */
  getSignedUrl: (name: keyof T & string, key: string, options: SignedUrlOptions) => Promise<string>;
  /** Verify that a signed URL has a valid signature and has not expired. */
  verifySignedUrl: (url: string, options: { env: Record<string, unknown> }) => Promise<boolean>;
  /** Extract the client-safe subset of the schema for use with `StorageProvider`. */
  clientConfig: () => ClientStorageConfig;
};
