/** A file extracted from a multipart form request, with metadata and a body stream. */
export type ParsedFile = {
  /** Original file name (e.g. `"photo.jpg"`). */
  name: string;
  /** File extension without the leading dot (e.g. `"jpg"`). */
  extension: string;
  /** MIME type from the form data entry. */
  type: string;
  /** File size in bytes. */
  size: number;
  /** Readable stream of the file body. */
  stream: ReadableStream<Uint8Array>;
};

/**
 * Extract the first `File` entry from a multipart form request.
 *
 * @param request - The incoming HTTP request containing multipart form data.
 * @returns The parsed file with metadata and a body stream.
 * @throws If no `File` entry is found in the form data.
 */
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
