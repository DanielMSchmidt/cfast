export async function serveFile(
  bucket: R2Bucket,
  key: string,
  headers?: Record<string, string>,
): Promise<Response> {
  const object = await bucket.get(key);

  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const responseHeaders = new Headers();
  object.writeHttpMetadata(responseHeaders);
  responseHeaders.set("content-length", String(object.size));

  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      responseHeaders.set(k, v);
    }
  }

  return new Response(object.body, { headers: responseHeaders });
}

export function getPublicUrl(baseUrl: string, key: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}/${key}`;
}

const DURATION_UNITS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Expected format: "1h", "30m", "7d", etc.`);
  }
  return parseFloat(match[1]) * DURATION_UNITS[match[2]];
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

export async function createSignedUrl(
  name: string,
  key: string,
  secret: string,
  expiresIn: string,
): Promise<string> {
  const durationMs = parseDuration(expiresIn);
  const expires = Math.floor((Date.now() + durationMs) / 1000);

  const payload = `${name}/${key}:${expires}`;
  const sig = await hmacSign(payload, secret);

  return `/storage/${name}/${key}?expires=${expires}&sig=${sig}`;
}

export async function verifySignedUrl(url: string, secret: string): Promise<boolean> {
  let pathname: string;
  let searchParams: URLSearchParams;

  try {
    const parsed = new URL(url, "http://localhost");
    pathname = parsed.pathname;
    searchParams = parsed.searchParams;
  } catch {
    return false;
  }

  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");

  if (!expires || !sig) return false;

  const expiresNum = parseInt(expires, 10);
  if (isNaN(expiresNum)) return false;
  if (expiresNum < Math.floor(Date.now() / 1000)) return false;

  const match = pathname.match(/^\/storage\/([^/]+)\/(.+)$/);
  if (!match) return false;

  const [, name, key] = match;
  const payload = `${name}/${key}:${expires}`;

  return hmacVerify(payload, sig, secret);
}
