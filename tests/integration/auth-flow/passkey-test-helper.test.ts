/**
 * Integration tests for `@cfast/auth/test-helpers/passkey`.
 *
 * Unit tests already prove the generator produces a valid, round-trippable
 * ES256 keypair and a COSE public key decodable by `@simplewebauthn`'s
 * own CBOR codec (the same one Better Auth uses at runtime). This suite
 * takes the next step: it inserts the generated `seedRow` into a **real**
 * D1 `passkeys` table using the production schema, then verifies the row
 * is readable through the exact SQL Better Auth issues during a passkey
 * login.
 *
 * That proves the test helper is compatible with the actual DB storage
 * shape end-to-end — if a schema migration ever drifted, this test would
 * fail before a downstream demo app could flake on it.
 */
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  generateTestPasskey,
  type PasskeySeedRow,
} from "@cfast/auth/test-helpers/passkey";
// Statically import the SimpleWebAuthn helpers so the (slow) module load
// happens once during test-file evaluation rather than inside the 5s budget
// of any individual `it(...)`. The previous lazy `await import(...)` was the
// dominant contributor to a flaky timeout in the COSE-decode test on CI.
import { isoCBOR } from "@simplewebauthn/server/helpers";
import { applyAuthMigrations, resetAuthTables } from "../helpers/auth-tables";

describe("passkey-test-helper (integration)", () => {
  beforeAll(async () => {
    await applyAuthMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetAuthTables(env.DB);
  });

  it("inserts a generated seedRow into a real D1 passkeys table and reads it back", async () => {
    // Seed the foreign-key target first. Better Auth's passkey row
    // references users.id via ON DELETE CASCADE.
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, email_verified) VALUES (?, ?, ?, 1)",
    )
      .bind("user-alice", "alice@test.com", "Alice")
      .run();

    // Generate a credential exactly the way a seed script would.
    const generated = await generateTestPasskey({
      userId: "user-alice",
      rpId: "localhost",
    });

    // Insert via the raw SQL column names, mirroring how
    // `db.insert(passkeys).values(seedRow)` ultimately compiles. This
    // catches any mismatch between the Drizzle property names we return
    // and the underlying D1 schema — if the seed row shipped a property
    // Drizzle did not know how to map, this insert would fail.
    await env.DB.prepare(
      `INSERT INTO passkeys (
         id, name, user_id, public_key, credential_id, counter,
         device_type, backed_up, transports, aaguid, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        generated.seedRow.id,
        generated.seedRow.name,
        generated.seedRow.userId,
        generated.seedRow.publicKey,
        generated.seedRow.credentialID,
        generated.seedRow.counter,
        generated.seedRow.deviceType,
        generated.seedRow.backedUp ? 1 : 0,
        generated.seedRow.transports,
        generated.seedRow.aaguid,
        Math.floor(generated.seedRow.createdAt.getTime() / 1000),
      )
      .run();

    // Now look the row up by credentialID exactly the way Better Auth
    // does during `/passkey/verify-authentication` — see the adapter
    // call in @better-auth/passkey's verifyPasskeyAuthentication. If
    // our `credentialID` field or our `publicKey` storage format does
    // not match, this lookup either fails to find the row or returns
    // garbage the verifier cannot decode.
    const row = await env.DB.prepare(
      "SELECT id, name, user_id, public_key, credential_id, counter, device_type, backed_up, transports, aaguid FROM passkeys WHERE credential_id = ?",
    )
      .bind(generated.credentialId)
      .first<{
        id: string;
        name: string;
        user_id: string;
        public_key: string;
        credential_id: string;
        counter: number;
        device_type: string;
        backed_up: number;
        transports: string;
        aaguid: string;
      }>();

    expect(row).not.toBeNull();
    expect(row!.user_id).toBe("user-alice");
    expect(row!.credential_id).toBe(generated.credentialId);
    // Better Auth's passkey plugin stores `publicKey` with standard
    // base64 + padding. If the generator ever drifted to base64url, the
    // next line would show `-` / `_` characters and the verifier would
    // reject the credential.
    expect(row!.public_key).toBe(generated.seedRow.publicKey);
    expect(row!.public_key.length % 4).toBe(0); // padded
    expect(row!.counter).toBe(0);
    expect(row!.device_type).toBe("singleDevice");
    expect(row!.backed_up).toBe(0);
    expect(row!.transports).toBe("internal");
  });

  // Workerd cold-starts + WebCrypto P-256 key generation are noticeably
  // slower than the rest of this file (~2s locally, more on CI runners),
  // so give this single test a wider budget than vitest's 5s default.
  it("stored public_key decodes to the COSE ES256 key the generator produced", { timeout: 15_000 }, async () => {
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, email_verified) VALUES (?, ?, ?, 1)",
    )
      .bind("user-bob", "bob@test.com", "Bob")
      .run();

    const generated = await generateTestPasskey({
      userId: "user-bob",
      rpId: "localhost",
    });

    await insertPasskey(env.DB, generated.seedRow);

    // Fetch the stored base64 public key and decode it through the
    // exact same CBOR codec Better Auth uses at runtime (via
    // `@simplewebauthn/server`'s `isoCBOR`). If this decodes into a
    // valid ES256 COSE key, Better Auth's passkey verifier will accept
    // it too.
    const row = await env.DB.prepare(
      "SELECT public_key FROM passkeys WHERE credential_id = ?",
    )
      .bind(generated.credentialId)
      .first<{ public_key: string }>();
    expect(row).not.toBeNull();

    const coseBytes = base64Decode(row!.public_key);
    const cose = isoCBOR.decodeFirst<Map<number, unknown>>(coseBytes);

    // kty: EC2 (2), alg: ES256 (-7), crv: P-256 (1)
    expect(cose.get(1)).toBe(2);
    expect(cose.get(3)).toBe(-7);
    expect(cose.get(-1)).toBe(1);
    expect(cose.get(-2)).toBeInstanceOf(Uint8Array);
    expect(cose.get(-3)).toBeInstanceOf(Uint8Array);
    expect((cose.get(-2) as Uint8Array).length).toBe(32);
    expect((cose.get(-3) as Uint8Array).length).toBe(32);
  });

  it("enforces the passkeys.credentialID uniqueness constraint", async () => {
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, email_verified) VALUES (?, ?, ?, 1)",
    )
      .bind("user-carol", "carol@test.com", "Carol")
      .run();

    const generated = await generateTestPasskey({
      userId: "user-carol",
      rpId: "localhost",
    });

    await insertPasskey(env.DB, generated.seedRow);

    // A second insert with the same credentialID must fail because the
    // `passkeys.credential_id` column has UNIQUE — this matches what
    // Better Auth relies on to prevent duplicate registrations. If the
    // helper ever emitted duplicate IDs by accident, this assertion
    // would catch it on the next CI run.
    let duplicateError: unknown;
    try {
      await insertPasskey(env.DB, {
        ...generated.seedRow,
        id: "different-pk-id",
      });
    } catch (err) {
      duplicateError = err;
    }
    expect(duplicateError).toBeDefined();
  });
});

/**
 * Helper to insert a seedRow via raw SQL so the integration test does
 * not need a Drizzle client of its own. Mirrors the INSERT column order
 * used by the Drizzle passkeys schema.
 */
async function insertPasskey(
  db: D1Database,
  row: PasskeySeedRow,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO passkeys (
         id, name, user_id, public_key, credential_id, counter,
         device_type, backed_up, transports, aaguid, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.id,
      row.name,
      row.userId,
      row.publicKey,
      row.credentialID,
      row.counter,
      row.deviceType,
      row.backedUp ? 1 : 0,
      row.transports,
      row.aaguid,
      Math.floor(row.createdAt.getTime() / 1000),
    )
    .run();
}

/**
 * Standard base64 decoder. Mirrors the encoder in
 * `src/test-helpers/passkey.ts`.
 */
function base64Decode(value: string): Uint8Array<ArrayBuffer> {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i++) lookup.set(alphabet[i]!, i);

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of value) {
    if (ch === "=") break;
    const v = lookup.get(ch);
    if (v === undefined) {
      throw new Error(`invalid base64 character: ${ch}`);
    }
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  const out = new Uint8Array(new ArrayBuffer(bytes.length));
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i]!;
  return out;
}
