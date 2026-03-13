import { StorageError } from "./errors.js";
import { detectMimeType, MAX_HEADER_SIZE } from "./magic-bytes.js";

/**
 * Validate that a Content-Type header value is in the accepted MIME type list.
 *
 * @param contentType - The `Content-Type` header value (may include parameters like `charset`).
 * @param accept - Accepted MIME type strings.
 * @throws {StorageError} With code `"INVALID_MIME_TYPE"` and status 415 if validation fails.
 */
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

/**
 * Validate that a Content-Length value does not exceed the maximum allowed size.
 *
 * Does nothing if `contentLength` is `null` (unknown length).
 *
 * @param contentLength - The declared content length in bytes, or `null` if unknown.
 * @param maxSizeBytes - Maximum allowed size in bytes.
 * @throws {StorageError} With code `"FILE_TOO_LARGE"` and status 413 if the length exceeds the max.
 */
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

/**
 * Read the first bytes of a stream to verify the file's actual MIME type via magic bytes.
 *
 * Returns a new stream with the header bytes prepended so the caller can continue
 * reading from the beginning. The `validated` flag indicates whether a known
 * signature was matched.
 *
 * @param stream - The incoming file body stream.
 * @param accept - Accepted MIME type strings.
 * @returns An object with the reconstituted `stream` and a `validated` flag.
 * @throws {StorageError} With code `"INVALID_MIME_TYPE"` if magic bytes identify a disallowed type.
 */
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

/**
 * Wrap a `ReadableStream` to count bytes as they pass through, erroring if the
 * maximum size is exceeded.
 *
 * @param source - The source stream to wrap.
 * @param maxSizeBytes - Maximum number of bytes allowed before the stream errors.
 * @returns An object with the wrapped `stream` and a `getByteCount` function that returns bytes read so far.
 */
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
