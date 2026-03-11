type ParsedBody = {
  actionName: string | null;
  input: Record<string, unknown>;
};

async function parseBody(request: Request): Promise<ParsedBody> {
  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.clone().json() as Record<string, unknown>;
    const { _action, ...input } = body;
    return { actionName: typeof _action === "string" ? _action : null, input };
  }

  // formData (url-encoded or multipart)
  const formData = await request.clone().formData();
  const input: Record<string, unknown> = {};
  let actionName: string | null = null;

  for (const [key, value] of formData.entries()) {
    if (key === "_action") {
      actionName = typeof value === "string" ? value : null;
    } else {
      input[key] = value;
    }
  }

  return { actionName, input };
}

export async function parseInput(request: Request): Promise<Record<string, unknown>> {
  const { input } = await parseBody(request);
  return input;
}

export async function extractActionName(request: Request): Promise<string | null> {
  const { actionName } = await parseBody(request);
  return actionName;
}
