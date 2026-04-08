import { describe, it, expect } from "vitest";
import {
  generateTestPasskey,
  type PasskeySeedRow,
} from "../test-helpers/passkey";

/**
 * Unit tests for the passkey test helper generator.
 *
 * These tests prove the generator produces **real, verifiable** passkey
 * credentials — not mocks, not fake bytes. Specifically they prove:
 *
 * 1. The returned seedRow matches the `passkeys` Drizzle schema shape.
 * 2. The COSE public key decodes losslessly via the same CBOR codec
 *    @simplewebauthn/server uses in production.
 * 3. The decoded COSE key has the correct ES256 / P-256 parameters and
 *    the X/Y coordinates are the ones the generator exported from the
 *    webcrypto P-256 keypair (round-trip).
 * 4. The private key is a valid PKCS#8 blob that webcrypto can re-import
 *    and use to sign data that the exported public key can verify —
 *    proving the keypair shipped to Playwright actually works.
 * 5. Deterministic credential IDs (opt-in) and random ones (default)
 *    both produce valid, distinct outputs.
 *
 * Browser-side validation (driving the virtual authenticator through
 * Playwright) lives in demo app e2e suites, not here — cfast's CI does
 * not spin up Chromium, and the unit tests above already prove the
 * generator output is a real WebAuthn credential.
 */
describe("generateTestPasskey", () => {
  it("returns a seedRow matching the passkeys schema shape", async () => {
    const result = await generateTestPasskey({
      userId: "user-alice",
      rpId: "localhost",
    });

    // Pinned to the Drizzle schema in src/schema.ts — if this list drifts,
    // the test fails loudly instead of silently inserting malformed rows.
    const requiredFields: Array<keyof PasskeySeedRow> = [
      "id",
      "name",
      "userId",
      "publicKey",
      "credentialID",
      "counter",
      "deviceType",
      "backedUp",
      "transports",
      "aaguid",
      "createdAt",
    ];
    for (const field of requiredFields) {
      expect(result.seedRow, `seedRow is missing ${field}`).toHaveProperty(
        field,
      );
    }

    expect(result.seedRow.userId).toBe("user-alice");
    expect(result.seedRow.counter).toBe(0);
    expect(result.seedRow.backedUp).toBe(false);
    expect(result.seedRow.deviceType).toBe("singleDevice");
    expect(result.seedRow.transports).toBe("internal");
    expect(result.seedRow.aaguid).toBe("00000000-0000-0000-0000-000000000000");
    expect(result.seedRow.name).toBe("Test Passkey");
    expect(result.seedRow.createdAt).toBeInstanceOf(Date);
    // id is freshly generated base64url, always non-empty.
    expect(result.seedRow.id.length).toBeGreaterThan(0);
    // credentialID in the row must match the top-level one the test
    // hands to addPasskeyCredential later.
    expect(result.seedRow.credentialID).toBe(result.credentialId);
  });

  it("honours explicit name / transports / aaguid / credentialId overrides", async () => {
    const pinnedCredentialId = "AAECAwQFBgcICQoLDA0ODw"; // 16 bytes, base64url
    const result = await generateTestPasskey({
      userId: "user-bob",
      rpId: "localhost",
      name: "Bob's Passkey",
      transports: "internal,hybrid",
      aaguid: "11111111-2222-3333-4444-555555555555",
      credentialId: pinnedCredentialId,
    });

    expect(result.seedRow.name).toBe("Bob's Passkey");
    expect(result.seedRow.transports).toBe("internal,hybrid");
    expect(result.seedRow.aaguid).toBe("11111111-2222-3333-4444-555555555555");
    expect(result.credentialId).toBe(pinnedCredentialId);
    expect(result.seedRow.credentialID).toBe(pinnedCredentialId);
  });

  it("produces distinct keys on successive calls by default", async () => {
    const a = await generateTestPasskey({
      userId: "user-a",
      rpId: "localhost",
    });
    const b = await generateTestPasskey({
      userId: "user-b",
      rpId: "localhost",
    });

    // Random credentialId, random keypair, random id. All three differ.
    expect(a.credentialId).not.toBe(b.credentialId);
    expect(a.privateKey).not.toBe(b.privateKey);
    expect(a.seedRow.publicKey).not.toBe(b.seedRow.publicKey);
    expect(a.seedRow.id).not.toBe(b.seedRow.id);
  });

  it("produces a COSE public key that decodes to a valid ES256 key", async () => {
    const result = await generateTestPasskey({
      userId: "user-c",
      rpId: "localhost",
    });

    // Decode the base64-encoded COSE bytes the seedRow would write to D1.
    const coseBytes = base64ToBytes(result.seedRow.publicKey);

    // Round-trip through @simplewebauthn's isoCBOR — if this parses, we
    // know Better Auth's verifier (which uses the same library) will
    // parse it too.
    const { isoCBOR } = await import("@simplewebauthn/server/helpers");
    const decoded = isoCBOR.decodeFirst<Map<number, unknown>>(coseBytes);

    expect(decoded).toBeInstanceOf(Map);
    // kty (1) = EC2 (2)
    expect(decoded.get(1)).toBe(2);
    // alg (3) = ES256 (-7)
    expect(decoded.get(3)).toBe(-7);
    // crv (-1) = P-256 (1)
    expect(decoded.get(-1)).toBe(1);

    // x (-2) and y (-3) are each 32-byte Uint8Arrays
    const x = decoded.get(-2);
    const y = decoded.get(-3);
    expect(x).toBeInstanceOf(Uint8Array);
    expect(y).toBeInstanceOf(Uint8Array);
    expect((x as Uint8Array).length).toBe(32);
    expect((y as Uint8Array).length).toBe(32);
  });

  it("returns a private key that signs data verifiable by the public key", async () => {
    // The ultimate correctness test: if we import the PKCS#8 private key
    // back into webcrypto, sign a challenge, and verify with a public
    // key reconstructed from the COSE coordinates, the signature must
    // validate. This proves the keypair we ship to Playwright is the
    // same keypair whose public half was written to the DB.
    const result = await generateTestPasskey({
      userId: "user-d",
      rpId: "localhost",
    });

    const subtle = globalThis.crypto.subtle;
    const privateKeyBytes = base64ToBytes(result.privateKey);
    const privateKey = await subtle.importKey(
      "pkcs8",
      privateKeyBytes.buffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    );

    // Reconstruct the public key from the COSE x/y coordinates.
    const coseBytes = base64ToBytes(result.seedRow.publicKey);
    const { isoCBOR } = await import("@simplewebauthn/server/helpers");
    const cose = isoCBOR.decodeFirst<Map<number, unknown>>(coseBytes);
    const x = cose.get(-2) as Uint8Array;
    const y = cose.get(-3) as Uint8Array;
    const rawPub = new Uint8Array(new ArrayBuffer(65));
    rawPub[0] = 0x04;
    rawPub.set(x, 1);
    rawPub.set(y, 33);
    const publicKey = await subtle.importKey(
      "raw",
      rawPub.buffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );

    const challenge = new TextEncoder().encode("test-challenge");
    const sig = await subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      challenge,
    );
    const ok = await subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      sig,
      challenge,
    );
    expect(ok).toBe(true);
  });
});

/**
 * Standard base64 decoder. Mirrors the encoder shipped in passkey.ts so
 * the test can round-trip bytes without pulling in Node's Buffer.
 *
 * Returns a `Uint8Array` backed by a concrete `ArrayBuffer` (not
 * `ArrayBufferLike`) so the result can be passed to APIs like
 * `@simplewebauthn/server`'s `isoCBOR.decodeFirst` and `subtle.importKey`
 * without TypeScript complaining about a potential `SharedArrayBuffer`.
 */
function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
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
