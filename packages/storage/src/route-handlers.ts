import type { StorageSchema, StorageInstance, FiletypeConfig } from "./types.js";
import { serveFile, verifyInstanceSignedToken, createInstanceSignedUrl } from "./serve.js";
import { StorageError } from "./errors.js";

/**
 * A minimal React Router v7 loader/action argument shape — we only depend on
 * `request` + `params`, so re-declaring the shape locally lets us avoid a
 * hard peer-dependency on `react-router`.
 */
type RouteArgs = {
  request: Request;
  params: Record<string, string | undefined>;
};

/**
 * User shape accepted by {@link createStorageRouteHandlers}. Kept narrow
 * (just `id`) so callers can hand in whatever their auth layer returns —
 * Better Auth users, custom session objects, etc.
 */
export type StorageRouteUser = { id: string; [k: string]: unknown };

/**
 * Options for {@link createStorageRouteHandlers}.
 */
export type CreateStorageRouteHandlersOptions<T extends StorageSchema> = {
  /** The storage instance returned from `defineStorage`. */
  storage: StorageInstance<T>;
  /**
   * Callback that returns the Workers environment for a given request.
   *
   * Defaults to reading `(request as any).context?.env`, which works with
   * the @cfast/core request adapter. Override this if your runtime exposes
   * env bindings somewhere else.
   */
  getEnv?: (request: Request) => Record<string, unknown>;
  /**
   * Authentication gate. Called on both GET (proxy) and POST (upload)
   * requests before any R2 interaction. Return the authenticated user or
   * throw a `Response` to abort. If omitted, the routes run unauthenticated
   * — only do this if the downstream `ownerCheck` or signed-token check is
   * sufficient for your threat model.
   *
   * On GET requests, if `requireUser` is omitted and the request carries a
   * `?token=...` query parameter, the token is validated against
   * `STORAGE_SECRET` instead of calling `requireUser`.
   */
  requireUser?: (request: Request) => Promise<StorageRouteUser> | StorageRouteUser;
  /**
   * Base path the routes are mounted at. Defaults to `"uploads"`. Must
   * match the `basePath` passed to {@link storageRoutes} so that signed
   * URLs resolve to the correct routes.
   */
  basePath?: string;
};

/**
 * Shape of the JSON body returned by a successful POST upload.
 *
 * - `key` — the R2 object key the file was stored under.
 * - `size` — the verified byte count.
 * - `type` — the MIME type recorded on the R2 object.
 * - `url` — a relative URL pointing at this storage instance's `/uploads/*`
 *   proxy route, so clients can display or link to the uploaded file
 *   without knowing the base path.
 */
export type UploadRouteResult = {
  key: string;
  size: number;
  type: string;
  url: string;
};

/**
 * Default env resolver. Reaches for `context.env` on the incoming Request —
 * this is where `@cfast/core` hangs Workers bindings when routing requests
 * into a React Router app. Callers that use a different adapter should pass
 * their own `getEnv`.
 */
function defaultGetEnv(request: Request): Record<string, unknown> {
  const withContext = request as Request & {
    context?: { env?: Record<string, unknown> };
  };
  return withContext.context?.env ?? {};
}

/**
 * Extract the splat portion of the URL for the `/uploads/*` route. React
 * Router passes the captured segment as `params["*"]`, but to keep this
 * helper usable outside of RR we also fall back to parsing the URL.
 */
function splatFrom(request: Request, params: Record<string, string | undefined>): string {
  const fromParams = params["*"];
  if (typeof fromParams === "string") return fromParams;
  const url = new URL(request.url);
  // Match "/uploads/...", "/files/...", etc — take everything after the first
  // segment, regardless of the mount path.
  const match = url.pathname.match(/^\/[^/]+\/(.*)$/);
  return match ? match[1] : "";
}

/** Convert any thrown value into an HTTP response body suitable for the client. */
function errorResponse(error: unknown): Response {
  if (error instanceof Response) return error;
  if (error instanceof StorageError) {
    return new Response(
      JSON.stringify({ code: error.code, detail: error.detail }),
      { status: error.status, headers: { "content-type": "application/json" } },
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return new Response(
    JSON.stringify({ code: "UPLOAD_FAILED", detail: message }),
    { status: 500, headers: { "content-type": "application/json" } },
  );
}

/**
 * Look up a filetype by name on a storage instance. Throws a
 * {@link StorageError} with status 404 if unknown.
 */
function findFiletype<T extends StorageSchema>(
  storage: StorageInstance<T>,
  name: string,
): FiletypeConfig<unknown> | null {
  const config = (storage.schema as Record<string, FiletypeConfig<unknown>>)[name];
  return config ?? null;
}

/**
 * Build `loader` and `action` handlers for the `/uploads/*` route.
 *
 * The returned pair implements the full opinionated upload + proxy story:
 *
 * - `loader` (GET requests) — streams the R2 object whose key matches
 *   `params["*"]`. If the storage definition declares an `ownerCheck` for
 *   the owning filetype, the check is invoked before streaming and a 403
 *   response is returned on failure. If the URL carries `?token=...`, the
 *   token is verified against `STORAGE_SECRET` instead of running
 *   `ownerCheck` (so tokens can be shared without exposing the underlying
 *   auth state).
 * - `action` (POST requests) — treats `params["*"]` as a filetype name,
 *   calls `storage.handle(name, request, ctx)`, and returns a JSON body of
 *   {@link UploadRouteResult}.
 *
 * @param options - Storage instance, auth gate, env resolver, and mount path.
 * @returns `{ loader, action }` ready to re-export from a splat route module.
 */
export function createStorageRouteHandlers<T extends StorageSchema>(
  options: CreateStorageRouteHandlersOptions<T>,
): {
  loader: (args: RouteArgs) => Promise<Response>;
  action: (args: RouteArgs) => Promise<Response>;
} {
  const getEnv = options.getEnv ?? defaultGetEnv;
  const basePath = `/${(options.basePath ?? "uploads").replace(/^\/+|\/+$/g, "")}`;

  /**
   * GET handler — streams an R2 object. Invariant: the `loader` only fires
   * on safe (GET/HEAD) requests, so we don't have to worry about parsing a
   * multipart body here.
   */
  async function loader({ request, params }: RouteArgs): Promise<Response> {
    try {
      const key = splatFrom(request, params);
      if (!key) return new Response("Not Found", { status: 404 });

      const env = getEnv(request);
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      // Resolve the filetype that owns this key: we pick the first filetype
      // whose bucket binding exists in env and whose `ownerCheck` (if any)
      // we can use to gate access. Because keys are globally unique inside a
      // bucket, consulting one filetype is enough; we use the first entry of
      // the schema as the default bucket resolver.
      const schema = options.storage.schema as Record<string, FiletypeConfig<unknown>>;
      const firstEntry = Object.values(schema)[0];
      if (!firstEntry) {
        return new Response("Not Found", { status: 404 });
      }

      // Token-based access bypasses requireUser/ownerCheck entirely.
      let user: StorageRouteUser | null = null;
      if (token) {
        const secret = (env as Record<string, string>)["STORAGE_SECRET"];
        if (!secret) {
          throw new StorageError({
            code: "INVALID_TOKEN",
            detail: "STORAGE_SECRET binding is not configured",
            status: 500,
          });
        }
        const ok = await verifyInstanceSignedToken(key, token, secret);
        if (!ok) {
          throw new StorageError({
            code: "INVALID_TOKEN",
            detail: "Signed URL token is invalid or has expired",
            status: 403,
          });
        }
      } else if (options.requireUser) {
        user = await options.requireUser(request);
      }

      // Find the matching filetype for ownerCheck — we pick the filetype
      // whose declared bucket key exists in env. When multiple filetypes
      // share a bucket, prefer the first one that declares an ownerCheck.
      const matching = Object.values(schema).filter((ft) => ft.bucket in env);
      const resolvedFiletype = matching.find((ft) => ft.ownerCheck) ?? matching[0] ?? firstEntry;

      // Run ownerCheck if present and we're not using a token.
      if (!token && resolvedFiletype.ownerCheck) {
        const allowed = await resolvedFiletype.ownerCheck(key, user, env);
        if (!allowed) {
          throw new StorageError({
            code: "UNAUTHORIZED",
            detail: "You do not have permission to access this file",
            status: 403,
          });
        }
      }

      const bucket = (env as Record<string, R2Bucket | undefined>)[resolvedFiletype.bucket];
      if (!bucket) {
        return new Response(`R2 bucket binding "${resolvedFiletype.bucket}" not found in env`, {
          status: 500,
        });
      }

      return await serveFile(bucket, key);
    } catch (e) {
      return errorResponse(e);
    }
  }

  /**
   * POST handler — runs an upload for the filetype named in `params["*"]`.
   * Returns a JSON body including a URL that points back at this same
   * `/uploads/*` proxy route so clients can immediately display the file.
   */
  async function action({ request, params }: RouteArgs): Promise<Response> {
    try {
      const name = splatFrom(request, params).split("/")[0];
      if (!name) {
        return new Response("Missing filetype name", { status: 400 });
      }

      const config = findFiletype(options.storage, name);
      if (!config) {
        return new Response(`Unknown filetype: "${name}"`, { status: 404 });
      }
      if (config.uploadable === false) {
        return new Response(`Filetype "${name}" is not uploadable`, { status: 403 });
      }

      const env = getEnv(request);
      const user = options.requireUser
        ? await options.requireUser(request)
        : ({ id: "anonymous" } as StorageRouteUser);

      const result = await options.storage.handle(name as keyof T & string, request, {
        env,
        user,
      });

      const url = `${basePath}/${result.key.replace(/^\/+/, "")}`;
      const body: UploadRouteResult = {
        key: result.key,
        size: result.size,
        type: result.type,
        url,
      };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      return errorResponse(e);
    }
  }

  return { loader, action };
}

/**
 * Convenience wrapper that mints an `/uploads/*` proxy URL for a given R2
 * key. Exported so callers who prefer a flat import (`createSignedUploadUrl`)
 * can avoid reaching into the storage instance — this is identical to
 * {@link StorageInstance.signedUrl}.
 *
 * @param key - R2 object key.
 * @param options - Must include `env` (with `STORAGE_SECRET`) and `expiresIn`.
 */
export async function createSignedUploadUrl(
  key: string,
  options: { env: Record<string, unknown>; expiresIn: string; basePath?: string },
): Promise<string> {
  const secret = (options.env as Record<string, string>)["STORAGE_SECRET"];
  if (!secret) throw new Error("STORAGE_SECRET binding not found in env");
  return createInstanceSignedUrl(key, secret, options.expiresIn, options.basePath);
}
