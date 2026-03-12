export type ParsedFile = {
  name: string;
  extension: string;
  type: string;
  size: number;
  stream: ReadableStream<Uint8Array>;
};

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
