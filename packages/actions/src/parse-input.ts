export async function parseInput(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.clone().json() as Record<string, unknown>;
    const { _action, ...input } = body;
    return input;
  }

  // formData (url-encoded or multipart)
  const formData = await request.clone().formData();
  const entries: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "_action") continue;
    entries[key] = value;
  }
  return entries;
}

export async function extractActionName(request: Request): Promise<string | null> {
  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.clone().json() as Record<string, unknown>;
    return (body._action as string) ?? null;
  }

  const formData = await request.clone().formData();
  return formData.get("_action") as string | null;
}
