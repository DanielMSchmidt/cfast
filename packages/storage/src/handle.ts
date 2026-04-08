import type { FiletypeConfig, HandleContext, UploadResult, NormalizedMimeGroup } from "./types.js";
import { parseSize } from "./schema.js";
import { parseRequest, type ParsedFile } from "./parse.js";
import { validateContentType, validateContentLength, validateMagicBytes, createByteCountingStream } from "./validation.js";
import { directPut, multipartUpload, replaceExisting } from "./upload.js";
import { StorageError } from "./errors.js";

/**
 * Convert a pre-extracted {@link File} into the internal {@link ParsedFile}
 * shape used by the upload pipeline. Used by the `handle(name, file, ctx)`
 * overload when the caller has already parsed the multipart body.
 */
function fileToParsed(file: File): ParsedFile {
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

/**
 * For a given mime type, return the matching {@link NormalizedMimeGroup} from
 * a filetype's `mimeGroups` list, or `undefined` if none matches.
 */
function findMimeGroup(
  mime: string,
  groups: readonly NormalizedMimeGroup[] | undefined,
): NormalizedMimeGroup | undefined {
  if (!groups) return undefined;
  return groups.find((g) => g.mimes.includes(mime));
}

/**
 * End-to-end upload handler: parse the request (or consume the pre-extracted
 * File), validate, upload to R2, and run hooks.
 *
 * This is the internal implementation behind `StorageInstance.handle()`. It
 * executes the full validation pipeline (content type, content length, magic
 * bytes, byte counting) and routes to direct PUT or multipart upload based
 * on file size. Per-mime size limits declared via {@link filetype}'s per-mime
 * form are enforced here.
 *
 * @param config - The file type configuration.
 * @param source - Either a raw `Request` containing multipart form data, or
 *   a pre-extracted `File` object when the caller has already parsed
 *   `request.formData()` themselves.
 * @param ctx - Handler context with env bindings, user, and optional input.
 * @returns The upload result with key, size, and MIME type.
 */
export async function handleUpload<TInput>(
  config: FiletypeConfig<TInput>,
  source: Request | File,
  ctx: HandleContext<TInput>,
): Promise<UploadResult> {
  const globalMaxBytes = parseSize(config.maxSize);
  const multipartThreshold = parseSize(config.multipartThreshold ?? "5mb");
  const partSizeBytes = parseSize(config.partSize ?? "10mb");

  // 1. Parse the file from the request (or accept a pre-extracted File)
  const parsed = source instanceof File ? fileToParsed(source) : await parseRequest(source);

  // 2. Validate content type from file metadata
  validateContentType(parsed.type, config.accept);

  // 3. Per-mime group resolution — a file whose mime belongs to a specific
  //    group must fit within that group's limit (#148). When no groups are
  //    configured, the global `maxSize` still applies.
  const mimeGroup = findMimeGroup(parsed.type, config.mimeGroups);
  const maxSizeBytes = mimeGroup?.maxSizeBytes ?? globalMaxBytes;

  // 4. Validate content length if known
  validateContentLength(parsed.size > 0 ? parsed.size : null, maxSizeBytes);

  // If the declared size fits globally but exceeds the per-mime limit, surface
  // a friendlier error that names the offending group.
  if (mimeGroup && parsed.size > 0 && parsed.size > mimeGroup.maxSizeBytes) {
    throw new StorageError({
      code: "FILE_TOO_LARGE",
      detail: `File is ${(parsed.size / (1024 * 1024)).toFixed(1)}MB but max allowed for ${parsed.type} is ${mimeGroup.maxSize}`,
      status: 413,
    });
  }

  // 5. Validate magic bytes
  const { stream: validatedStream } = await validateMagicBytes(parsed.stream, config.accept);

  // 6. Wrap with byte counting
  const { stream: countedStream, getByteCount } = createByteCountingStream(validatedStream, maxSizeBytes);

  // 7. Generate key
  const keyCtx = { user: ctx.user, input: ctx.input ?? ({} as TInput) };
  const key = config.key({ name: parsed.name, extension: parsed.extension }, keyCtx);

  // 8. Run beforeUpload hook
  if (config.hooks?.beforeUpload) {
    await config.hooks.beforeUpload(
      { name: parsed.name, extension: parsed.extension, type: parsed.type, size: parsed.size },
      ctx,
    );
  }

  // 9. Get the bucket from env
  // Workers env boundary: R2 bucket bindings are injected by the Workers runtime
  // and typed as `unknown` via HandleContext.env. We validate presence and cast
  // to R2Bucket since there is no runtime type tag to check beyond existence.
  const bucket = ctx.env[config.bucket] as R2Bucket | undefined;
  if (!bucket) {
    throw new Error(`R2 bucket binding "${config.bucket}" not found in env`);
  }

  // 10. Replace existing files if configured
  if (config.replace) {
    const lastSlash = key.lastIndexOf("/");
    if (lastSlash >= 0) {
      const prefix = key.slice(0, lastSlash + 1);
      await replaceExisting(bucket, prefix);
    }
  }

  // 11. Upload — choose strategy based on file size
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

  // 12. Run afterUpload hook
  if (config.hooks?.afterUpload) {
    await config.hooks.afterUpload(result, ctx);
  }

  return result;
}
