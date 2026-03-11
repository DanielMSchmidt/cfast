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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal constraint type for schema registration
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
