import { describe, it, expect, vi } from "vitest";
import { defineStorage, filetype } from "../schema.js";
import {
  createStorageRouteHandlers,
  createSignedUploadUrl,
  type UploadRouteResult,
} from "../route-handlers.js";
import { storageRoutes, createStorageRoutes } from "../plugin.js";
import { createMockR2Bucket, createMockFormDataRequest } from "./helpers.js";

/**
 * Shared test fixture — a storage definition that mirrors the shape we'd
 * expect a consumer app (products with signed vendor access) to use. The
 * `ownerCheck` implementation derives the vendor id from the key prefix so
 * we can verify access control without a real database.
 */
function buildFixtureStorage() {
  const schema = {
    productImages: filetype(
      {
        image: { mimes: ["image/jpeg", "image/png"], maxSize: "10mb" },
        document: { mimes: ["application/pdf"], maxSize: "50mb" },
      },
      {
        bucket: "UPLOADS",
        key: (file: { name: string }, ctx: { input: { productId?: string }; user: { id: string } }) =>
          `products/${ctx.input?.productId ?? "default"}/${file.name}`,
        ownerCheck: async (key, user) => {
          // key = "products/<productId>/<name>", user owns productIds that
          // start with their id prefix in this fixture.
          const parts = key.split("/");
          if (parts[0] !== "products") return false;
          const productId = parts[1] ?? "";
          return productId.startsWith(user?.id ?? "");
        },
      },
    ),
  };
  return defineStorage(schema);
}

describe("storageRoutes / createStorageRoutes", () => {
  it("returns a splat route entry pointing at the given handler file", () => {
    const routes = storageRoutes({ handlerFile: "routes/uploads.$.tsx" });
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      id: "cfast-storage",
      path: "uploads/*",
      file: "routes/uploads.$.tsx",
    });
  });

  it("respects a custom basePath and trims leading/trailing slashes", () => {
    const routes = storageRoutes({
      handlerFile: "routes/files.$.tsx",
      basePath: "/files/",
    });
    expect(routes[0].path).toBe("files/*");
  });

  it("exports an alias `createStorageRoutes` that produces identical entries", () => {
    const a = storageRoutes({ handlerFile: "routes/uploads.$.tsx" });
    const b = createStorageRoutes({ handlerFile: "routes/uploads.$.tsx" });
    expect(b).toEqual(a);
  });
});

describe("createStorageRouteHandlers — GET (proxy)", () => {
  function jpegBodyStream() {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("file content"));
        controller.close();
      },
    });
  }

  function proxyObject(): R2ObjectBody {
    return {
      body: jpegBodyStream(),
      httpMetadata: { contentType: "image/jpeg" },
      size: 12,
      key: "products/vendor-1/photo.jpg",
      writeHttpMetadata: vi.fn((headers: Headers) => {
        headers.set("content-type", "image/jpeg");
      }),
    } as unknown as R2ObjectBody;
  }

  it("streams an R2 object when requireUser + ownerCheck allow access", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket({ getResult: proxyObject() });
    const requireUser = vi.fn(async () => ({ id: "vendor-1" }));

    const { loader } = createStorageRouteHandlers({
      storage,
      requireUser,
      getEnv: () => ({ UPLOADS: bucket }),
    });

    const request = new Request("http://localhost/uploads/products/vendor-1/photo.jpg");
    const response = await loader({ request, params: { "*": "products/vendor-1/photo.jpg" } });

    expect(response.status).toBe(200);
    expect(bucket.get).toHaveBeenCalledWith("products/vendor-1/photo.jpg");
    expect(requireUser).toHaveBeenCalledOnce();
  });

  it("returns 403 when ownerCheck rejects the requesting user", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket({ getResult: proxyObject() });
    const requireUser = vi.fn(async () => ({ id: "attacker" }));

    const { loader } = createStorageRouteHandlers({
      storage,
      requireUser,
      getEnv: () => ({ UPLOADS: bucket }),
    });

    const request = new Request("http://localhost/uploads/products/vendor-1/photo.jpg");
    const response = await loader({ request, params: { "*": "products/vendor-1/photo.jpg" } });

    expect(response.status).toBe(403);
    const body = (await response.json()) as { code: string };
    expect(body.code).toBe("UNAUTHORIZED");
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it("returns 404 when the splat is empty", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket({ getResult: proxyObject() });
    const { loader } = createStorageRouteHandlers({
      storage,
      getEnv: () => ({ UPLOADS: bucket }),
    });
    const request = new Request("http://localhost/uploads/");
    const response = await loader({ request, params: { "*": "" } });
    expect(response.status).toBe(404);
  });

  it("accepts a valid signed token without calling requireUser or ownerCheck", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket({ getResult: proxyObject() });
    const env = { UPLOADS: bucket, STORAGE_SECRET: "secret-abc" };

    const url = await storage.signedUrl("products/vendor-1/photo.jpg", {
      env,
      expiresIn: "1h",
    });

    const requireUser = vi.fn(async () => {
      throw new Error("requireUser must not be called when a token is present");
    });

    const { loader } = createStorageRouteHandlers({
      storage,
      requireUser,
      getEnv: () => env,
    });

    const request = new Request(`http://localhost${url}`);
    // Extract the splat portion from the full path (strip leading /uploads/)
    const params = { "*": "products/vendor-1/photo.jpg" };
    const response = await loader({ request, params });

    expect(response.status).toBe(200);
    expect(requireUser).not.toHaveBeenCalled();
  });

  it("rejects tampered signed tokens with 403 INVALID_TOKEN", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket({ getResult: proxyObject() });
    const env = { UPLOADS: bucket, STORAGE_SECRET: "secret-abc" };

    const url = await storage.signedUrl("products/vendor-1/photo.jpg", {
      env,
      expiresIn: "1h",
    });
    // Tamper with the token by mutating the last character of the signature.
    const tamperedUrl = url.slice(0, -1) + (url.endsWith("a") ? "b" : "a");

    const { loader } = createStorageRouteHandlers({
      storage,
      getEnv: () => env,
    });

    const request = new Request(`http://localhost${tamperedUrl}`);
    const response = await loader({
      request,
      params: { "*": "products/vendor-1/photo.jpg" },
    });

    expect(response.status).toBe(403);
    const body = (await response.json()) as { code: string };
    expect(body.code).toBe("INVALID_TOKEN");
  });

  it("rejects expired signed tokens", async () => {
    const storage = buildFixtureStorage();
    const env = { UPLOADS: createMockR2Bucket(), STORAGE_SECRET: "secret-abc" };

    // Mint a token that expires 1 second ago by temporarily rewinding Date.now.
    const realNow = Date.now;
    try {
      Date.now = () => realNow() - 60 * 60 * 1000 - 1000;
      const url = await storage.signedUrl("products/vendor-1/photo.jpg", {
        env,
        expiresIn: "1h",
      });
      Date.now = realNow;

      const { loader } = createStorageRouteHandlers({
        storage,
        getEnv: () => env,
      });

      const request = new Request(`http://localhost${url}`);
      const response = await loader({
        request,
        params: { "*": "products/vendor-1/photo.jpg" },
      });

      expect(response.status).toBe(403);
      const body = (await response.json()) as { code: string };
      expect(body.code).toBe("INVALID_TOKEN");
    } finally {
      Date.now = realNow;
    }
  });
});

describe("createStorageRouteHandlers — POST (upload)", () => {
  it("accepts a multipart upload and returns { key, size, type, url }", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket();
    const requireUser = vi.fn(async () => ({ id: "vendor-1" }));

    const { action } = createStorageRouteHandlers({
      storage,
      requireUser,
      getEnv: () => ({ UPLOADS: bucket }),
    });

    const jpegData = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0x00),
    ]);
    const request = createMockFormDataRequest(
      { name: "photo.jpg", type: "image/jpeg", content: jpegData },
      "/uploads/productImages",
    );

    const response = await action({
      request,
      params: { "*": "productImages" },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as UploadRouteResult;
    expect(body.key).toContain("products/");
    expect(body.key).toContain("photo.jpg");
    expect(body.type).toBe("image/jpeg");
    expect(body.url).toBe(`/uploads/${body.key}`);
    expect(bucket.put).toHaveBeenCalled();
    expect(requireUser).toHaveBeenCalledOnce();
  });

  it("returns 404 when the filetype name is unknown", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket();
    const { action } = createStorageRouteHandlers({
      storage,
      getEnv: () => ({ UPLOADS: bucket }),
    });
    const request = new Request("http://localhost/uploads/nope", { method: "POST" });
    const response = await action({ request, params: { "*": "nope" } });
    expect(response.status).toBe(404);
  });

  it("surfaces StorageError mime mismatches as JSON with the right status", async () => {
    const storage = buildFixtureStorage();
    const bucket = createMockR2Bucket();

    const { action } = createStorageRouteHandlers({
      storage,
      requireUser: async () => ({ id: "vendor-1" }),
      getEnv: () => ({ UPLOADS: bucket }),
    });

    const request = createMockFormDataRequest(
      { name: "note.txt", type: "text/plain", content: new Uint8Array([0x00]) },
      "/uploads/productImages",
    );

    const response = await action({
      request,
      params: { "*": "productImages" },
    });
    expect(response.status).toBe(415);
    const body = (await response.json()) as { code: string };
    expect(body.code).toBe("INVALID_MIME_TYPE");
  });
});

describe("createSignedUploadUrl", () => {
  it("mints a URL whose token verifies round-trip", async () => {
    const storage = buildFixtureStorage();
    const env = { STORAGE_SECRET: "secret-for-test" };

    const url = await createSignedUploadUrl("products/vendor-1/photo.jpg", {
      env,
      expiresIn: "1h",
    });

    expect(url).toMatch(/^\/uploads\/products\/vendor-1\/photo\.jpg\?token=/);
    const token = new URL(url, "http://localhost").searchParams.get("token");
    expect(token).toBeTruthy();

    const valid = await storage.verifySignedToken("products/vendor-1/photo.jpg", token!, { env });
    expect(valid).toBe(true);
  });

  it("throws when STORAGE_SECRET is not in env", async () => {
    await expect(
      createSignedUploadUrl("key", { env: {}, expiresIn: "1h" }),
    ).rejects.toThrow("STORAGE_SECRET");
  });
});
