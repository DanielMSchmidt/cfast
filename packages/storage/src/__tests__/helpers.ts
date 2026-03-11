import { vi } from "vitest";

export function createMockR2Bucket(options?: {
  putResult?: R2Object;
  getResult?: R2ObjectBody | null;
  listResult?: R2Objects;
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
      uploadPart: vi.fn(async (partNumber: number, _value: unknown) => ({
        partNumber,
        etag: `etag-${partNumber}`,
      })),
      complete: vi.fn(async () => ({ key, size: 100 }) as R2Object),
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
