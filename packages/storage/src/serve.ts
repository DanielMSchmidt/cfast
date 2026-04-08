/**
 * Stream a file from an R2 bucket as an HTTP `Response`.
 *
 * Sets `content-length` and any HTTP metadata stored on the object. Returns
 * a 404 response if the key does not exist.
 *
 * @param bucket - The R2 bucket binding.
 * @param key - The object key to retrieve.
 * @param headers - Optional additional response headers (e.g. `Cache-Control`).
 * @returns A `Response` streaming the object body, or a 404 response.
 */
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

/**
 * Build a public URL by joining a base URL with an object key.
 *
 * @param baseUrl - The public base URL for the bucket (trailing slash is trimmed).
 * @param key - The R2 object key.
 * @returns The full public URL.
 */
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

/**
 * Generate an HMAC-signed URL for time-limited access to a private file.
 *
 * @param name - The file type name from the storage schema.
 * @param key - The R2 object key.
 * @param secret - HMAC secret (from the `STORAGE_SECRET` binding).
 * @param expiresIn - Duration string (e.g. `"1h"`, `"30m"`, `"7d"`).
 * @returns A signed URL path with `expires` and `sig` query parameters.
 */
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

/**
 * Mint a signed URL pointing at the opinionated `/uploads/*` proxy route.
 *
 * Unlike {@link createSignedUrl}, this does not embed a filetype name — the
 * token binds only the object key and expiry, which is all the `/uploads/*`
 * proxy route needs to authorize a download.
 *
 * @param key - The R2 object key.
 * @param secret - HMAC secret (from the `STORAGE_SECRET` binding).
 * @param expiresIn - Duration string (e.g. `"1h"`, `"30m"`, `"7d"`).
 * @param basePath - Mount path of the proxy route (defaults to `"/uploads"`).
 * @returns A relative URL of the form `/{basePath}/{key}?token={expires}.{sig}`.
 */
export async function createInstanceSignedUrl(
  key: string,
  secret: string,
  expiresIn: string,
  basePath?: string,
): Promise<string> {
  const durationMs = parseDuration(expiresIn);
  const expires = Math.floor((Date.now() + durationMs) / 1000);

  const payload = `${key}:${expires}`;
  const sig = await hmacSign(payload, secret);
  const token = `${expires}.${sig}`;

  const normalizedBase = (basePath ?? "/uploads").replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedKey}?token=${token}`;
}

/**
 * Verify a token minted by {@link createInstanceSignedUrl} against an R2 key.
 *
 * @param key - The R2 object key the caller is trying to access.
 * @param token - The raw `token` query parameter (e.g. `1700000000.abc123…`).
 * @param secret - The HMAC secret used when the token was created.
 * @returns `true` if the token is well-formed, unexpired, and the HMAC
 *   matches; `false` otherwise.
 */
export async function verifyInstanceSignedToken(
  key: string,
  token: string | null,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0) return false;
  const expiresStr = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!sig) return false;

  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires)) return false;
  if (expires < Math.floor(Date.now() / 1000)) return false;

  const payload = `${key}:${expires}`;
  return hmacVerify(payload, sig, secret);
}

/**
 * Verify that a signed URL has a valid HMAC signature and has not expired.
 *
 * @param url - The signed URL (absolute or relative path with query parameters).
 * @param secret - The HMAC secret used when the URL was created.
 * @returns `true` if the signature is valid and the URL has not expired, `false` otherwise.
 */
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
