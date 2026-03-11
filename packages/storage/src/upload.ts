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
  for (let i = 0; i < partBuffers.length; i += options.concurrency) {
    const batch = partBuffers.slice(i, i + options.concurrency);
    const batchResults = await Promise.all(
      batch.map((partData, batchIndex) => {
        const pn = partNumber + batchIndex;
        return upload.uploadPart(pn, partData);
      }),
    );
    parts.push(...batchResults);
    partNumber += batch.length;
  }

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
