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
    const parts = await uploadPartsStreaming(upload, stream, options);
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

async function uploadPartsStreaming(
  upload: R2MultipartUpload,
  stream: ReadableStream<Uint8Array>,
  options: { partSize: number; concurrency: number },
): Promise<R2UploadedPart[]> {
  const reader = stream.getReader();
  const parts: R2UploadedPart[] = [];
  let partNumber = 1;
  let buffer = new Uint8Array(0);
  const pending: Array<Promise<R2UploadedPart>> = [];

  while (true) {
    const { value, done } = await reader.read();

    if (value) {
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;
    }

    // Upload complete parts as they become available
    while (buffer.length >= options.partSize) {
      const partData = buffer.slice(0, options.partSize);
      buffer = buffer.slice(options.partSize);
      const pn = partNumber++;

      pending.push(upload.uploadPart(pn, partData));

      // Drain when we hit concurrency limit
      if (pending.length >= options.concurrency) {
        const result = await pending.shift()!;
        parts.push(result);
      }
    }

    if (done) {
      // Upload remaining buffer as final part
      if (buffer.length > 0) {
        const pn = partNumber++;
        pending.push(upload.uploadPart(pn, buffer));
      }
      break;
    }
  }

  // Wait for all remaining pending uploads
  const remaining = await Promise.all(pending);
  parts.push(...remaining);

  // Sort parts by number (R2 requires ordered parts)
  parts.sort((a, b) => a.partNumber - b.partNumber);

  return parts;
}

export async function replaceExisting(
  bucket: R2Bucket,
  prefix: string,
): Promise<void> {
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({ prefix, cursor });

    if (listed.objects.length > 0) {
      const keys = listed.objects.map((obj) => obj.key);
      await bucket.delete(keys);
    }

    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
}
