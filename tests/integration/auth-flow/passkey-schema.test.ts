import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createAuth } from "@cfast/auth";
import * as authSchema from "@cfast/auth/schema";
import { definePermissions, grant } from "@cfast/permissions";
import {
  applyAuthMigrations,
  resetAuthTables,
} from "../helpers/auth-tables";

const permissions = definePermissions({
  roles: ["anonymous", "user"] as const,
  grants: {
    anonymous: [],
    user: [grant("read", "posts")],
  },
});

describe("passkey-schema", () => {
  beforeAll(async () => {
    await applyAuthMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetAuthTables(env.DB);
  });

  it("boots Better Auth with the passkey plugin against real D1 and Drizzle schema", () => {
    const initAuth = createAuth({
      permissions,
      schema: authSchema,
      anonymousRoles: ["anonymous"],
      defaultRoles: ["user"],
      passkeys: { rpName: "Test App", rpId: "localhost" },
    });
    const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });

    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe("function");
  });

  it("passkey schema Drizzle property names match Better Auth expectations", () => {
    // Better Auth's passkey plugin queries the adapter with these field names:
    //   credentialID (capital D), userId, transports, counter, deviceType,
    //   backedUp, publicKey, aaguid
    //
    // The Drizzle adapter resolves these by looking up property names on the
    // schema table object. If the schema uses `credentialId` (lowercase d)
    // instead of `credentialID`, Better Auth throws:
    //   "The field 'credentialID' does not exist in the 'passkeys' Drizzle schema"
    //
    // This test catches that exact class of bug.
    const passkeyColumns = Object.keys(authSchema.passkeys);

    // The critical field that caused the original bug (#84)
    expect(passkeyColumns).toContain("credentialID");
    expect(passkeyColumns).not.toContain("credentialId");

    // All fields the passkey plugin reads
    expect(passkeyColumns).toContain("userId");
    expect(passkeyColumns).toContain("publicKey");
    expect(passkeyColumns).toContain("counter");
    expect(passkeyColumns).toContain("deviceType");
    expect(passkeyColumns).toContain("backedUp");
    expect(passkeyColumns).toContain("transports");
    expect(passkeyColumns).toContain("aaguid");
  });

  it(
    "passkey table in D1 supports insert and query with correct column mapping",
    { timeout: 30_000 },
    async () => {
      // Create a test user (FK target)
      await env.DB.exec(
        "INSERT INTO users (id, email, name, email_verified) VALUES ('user-1', 'test@test.com', 'Test', 0)",
      );

      // Insert a passkey using the SQL column names that the Drizzle schema maps to.
      // This verifies the D1 table structure matches the schema definition.
      await env.DB.prepare(
        `INSERT INTO passkeys (id, name, user_id, public_key, credential_id, counter, device_type, backed_up, transports, aaguid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          "pk-1",
          "Test Passkey",
          "user-1",
          "test-public-key-base64",
          "test-credential-id-base64",
          0,
          "singleDevice",
          0,
          "internal",
          "00000000-0000-0000-0000-000000000000",
        )
        .run();

      // Query back and verify all columns are present
      const row = await env.DB.prepare("SELECT * FROM passkeys WHERE id = ?")
        .bind("pk-1")
        .first();

      expect(row).not.toBeNull();
      expect(row!.credential_id).toBe("test-credential-id-base64");
      expect(row!.device_type).toBe("singleDevice");
      expect(row!.backed_up).toBe(0);
      expect(row!.aaguid).toBe("00000000-0000-0000-0000-000000000000");
      expect(row!.transports).toBe("internal");
    },
  );

  it(
    "Better Auth passkey plugin can initialize and handle requests without schema errors",
    { timeout: 30_000 },
    async () => {
      const initAuth = createAuth({
        permissions,
        schema: authSchema,
        anonymousRoles: ["anonymous"],
        defaultRoles: ["user"],
        passkeys: { rpName: "Test App", rpId: "localhost" },
      });
      const auth = initAuth({ d1: env.DB, appUrl: env.APP_URL });

      // Sign up a user to get a valid session
      const signupRes = await auth.handler(
        new Request("http://localhost:8787/api/auth/sign-up/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "passkey@test.com",
            password: "Test1234!",
            name: "Passkey User",
          }),
        }),
      );
      expect(signupRes.status).toBeLessThan(400);

      const cookies = signupRes.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");

      // Verify session works
      const sessionRes = await auth.handler(
        new Request("http://localhost:8787/api/auth/get-session", {
          method: "GET",
          headers: { cookie: cookies },
        }),
      );
      expect(sessionRes.status).toBe(200);

      // Request passkey registration options. If the endpoint is available
      // (depends on @simplewebauthn/server working in Workers), verify the
      // response. If not (404), verify it's not a 500 schema error.
      const regOptionsRes = await auth.handler(
        new Request(
          "http://localhost:8787/api/auth/passkey/generate-register-options",
          {
            method: "GET",
            headers: { cookie: cookies },
          },
        ),
      );

      if (regOptionsRes.status === 200) {
        // Full passkey flow works — verify the response shape
        const json = (await regOptionsRes.json()) as Record<string, unknown>;
        expect(json).toHaveProperty("challenge");
        expect(json).toHaveProperty("rp");
        const rp = json.rp as Record<string, unknown>;
        expect(rp.name).toBe("Test App");
        expect(rp.id).toBe("localhost");
      } else {
        // The passkey endpoint may not be available in the Workers test
        // environment due to @simplewebauthn/server compatibility.
        // The critical assertion: it must NOT be a 500 with a schema error.
        // A 404 (route not registered) or 401 (auth issue) is acceptable.
        expect(
          regOptionsRes.status,
          "Passkey endpoint should not return 500 (schema error)",
        ).not.toBe(500);
      }
    },
  );
});
