import type { FiletypeConfig, HandleContext, UploadResult } from "./types.js";
import { parseSize } from "./schema.js";
import { parseRequest } from "./parse.js";
import { validateContentType, validateContentLength, validateMagicBytes, createByteCountingStream } from "./validation.js";
import { directPut, multipartUpload, replaceExisting } from "./upload.js";

/**
 * End-to-end upload handler: parse the request, validate, upload to R2, and run hooks.
 *
 * This is the internal implementation behind `StorageInstance.handle()`. It executes
 * the full validation pipeline (content type, content length, magic bytes, byte counting)
 * and routes to direct PUT or multipart upload based on file size.
 *
 * @param config - The file type configuration.
 * @param request - The incoming HTTP request containing multipart form data.
 * @param ctx - Handler context with env bindings, user, and optional input.
 * @returns The upload result with key, size, and MIME type.
 */
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
