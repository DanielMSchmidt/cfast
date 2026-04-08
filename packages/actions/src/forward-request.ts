/**
 * Options accepted by {@link forwardRequest}.
 *
 * Pass `body` to replace the original body (typical when an action handler
 * builds a sub-action's payload), `method` to override the HTTP method, or
 * `url` to dispatch to a different route. Any field omitted defaults to the
 * value from the source request, so the new request stays a faithful clone
 * of the original — including cookies, `Authorization`, `X-CSRF-Token`,
 * and any other headers your auth or middleware layer relies on.
 */
export type ForwardRequestInit = {
  /**
   * Replacement body for the forwarded request. Accepts anything `Request`
   * itself accepts (including `FormData`, `URLSearchParams`, `string`, and
   * `ReadableStream`). Pass `null` to forward without a body.
   *
   * Defaults to the source request's body. Note that streaming bodies are
   * single-use, so the source request will be drained when forwarding the
   * default body — clone the source request first if you need to read it
   * elsewhere.
   */
  body?: BodyInit | null;
  /** HTTP method override. Defaults to the source request's method. */
  method?: string;
  /** URL override. Defaults to the source request's URL. */
  url?: string;
  /**
   * Additional headers to merge on top of the forwarded headers. Use this
   * to set `Content-Type` (e.g. when replacing the body with JSON) without
   * having to assemble a full `Headers` instance manually.
   */
  headers?: HeadersInit;
};

/**
 * Builds a new {@link Request} that mirrors `original` (URL, method, headers,
 * cookies) with optional overrides for body, URL, method, or extra headers.
 *
 * Use this when an action handler needs to dispatch a sub-action — for
 * example, an "import CSV" action that builds many "create row" sub-action
 * requests. Sub-actions resolved with the framework's `getContext()` callback
 * see a `null` user unless the request still carries the original cookies,
 * which is exactly what `forwardRequest` preserves.
 *
 * The returned request is a fresh `Request`, not a `clone()` of the source.
 * That means:
 *
 * - The forwarded request has its own (drainable) body. Reading it does not
 *   affect the source request.
 * - Headers are deep-copied. Mutating the returned request's headers does
 *   not leak back into the source.
 * - When `body` is omitted, the source request's body stream is consumed.
 *   If you need to keep the source readable, call `original.clone()` before
 *   passing it in, or supply a fresh `body` explicitly.
 *
 * @param original - The incoming request to forward.
 * @param init - Optional overrides for body, method, URL, and headers.
 * @returns A new `Request` ready to hand to a sub-action.
 *
 * @example Basic sub-action dispatch
 * ```ts
 * import { forwardRequest } from "@cfast/actions";
 *
 * const importCsv = createAction(async (db, input, ctx) => ({
 *   permissions: createRow.buildOperation(db, {} as never, ctx).permissions,
 *   async run() {
 *     for (const row of input.rows) {
 *       const subFormData = new FormData();
 *       subFormData.set("_action", "createRow");
 *       subFormData.set("title", row.title);
 *       const subRequest = forwardRequest(ctx.request, { body: subFormData });
 *       await createRow.action({ request: subRequest, params: {}, context: undefined });
 *     }
 *     return { ok: true };
 *   },
 * }));
 * ```
 *
 * @example JSON body with explicit Content-Type
 * ```ts
 * const subRequest = forwardRequest(originalRequest, {
 *   body: JSON.stringify({ title: "Hello" }),
 *   headers: { "Content-Type": "application/json" },
 * });
 * ```
 */
export function forwardRequest(
  original: Request,
  init: ForwardRequestInit = {},
): Request {
  // Start from the source headers so cookies, auth tokens, and any other
  // request-scoped middleware state are preserved by default.
  const headers = new Headers(original.headers);

  if (init.headers) {
    const overrides = new Headers(init.headers);
    overrides.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  const method = init.method ?? original.method;
  const url = init.url ?? original.url;

  // GET/HEAD requests cannot carry a body. Match the platform behaviour by
  // refusing to forward a body in that case rather than letting the Request
  // constructor throw a generic TypeError deep in user code.
  const bodylessMethod = method === "GET" || method === "HEAD";
  if (bodylessMethod && init.body !== undefined && init.body !== null) {
    throw new TypeError(
      `forwardRequest: cannot attach a body to a ${method} request. ` +
        `Either omit "body" or set "method" to a body-bearing verb (e.g. POST).`,
    );
  }

  let body: BodyInit | null;
  if (init.body !== undefined) {
    body = init.body;
    // When the body is replaced with a FormData or URLSearchParams instance
    // we must let the platform pick the matching `Content-Type` (which
    // includes the multipart boundary for FormData). Carrying over the
    // source request's `content-type: application/json` would crash the
    // body parser on the receiving end. The caller can still force a value
    // by passing it explicitly via `init.headers`.
    const isStructuredBody =
      typeof FormData !== "undefined" && body instanceof FormData ||
      typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
    const callerSetContentType =
      init.headers !== undefined &&
      new Headers(init.headers).has("content-type");
    if (isStructuredBody && !callerSetContentType) {
      headers.delete("content-type");
      headers.delete("content-length");
    }
  } else if (bodylessMethod) {
    body = null;
  } else {
    // Use the source body unmodified. The source request is single-use after
    // this; callers who need to read it elsewhere should clone it first.
    body = (original as Request & { body: BodyInit | null }).body;
  }

  const requestInit: RequestInit = {
    method,
    headers,
    body,
    redirect: original.redirect,
    referrer: original.referrer,
    referrerPolicy: original.referrerPolicy,
    signal: original.signal,
  };

  // `duplex: "half"` is required by the Fetch spec when sending a streaming
  // body to the Request constructor. Workers and undici both enforce it.
  if (body !== null && typeof (body as ReadableStream).getReader === "function") {
    (requestInit as RequestInit & { duplex?: "half" }).duplex = "half";
  }

  return new Request(url, requestInit);
}
