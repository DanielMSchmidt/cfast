/**
 * @module test-helpers/passkey
 *
 * Playwright-ready passkey test helpers for `@cfast/auth`.
 *
 * End-to-end tests that exercise a passkey login flow in a real browser
 * have historically been impossible without either (a) running a test-only
 * "register a credential for me" endpoint next to the real auth routes
 * (ugly, security risk) or (b) driving the OS authenticator (impossible
 * in CI). This module solves both problems by pre-generating a credential
 * at seed time and injecting it into Chromium's Web Platform Virtual
 * Authenticator via the Chrome DevTools Protocol at test time.
 *
 * The result: a Playwright test can click "Sign in with passkey" and the
 * **real** Better Auth passkey verification endpoint runs against a
 * **real** signature produced by Chrome's real WebAuthn stack against
 * the virtual authenticator. Zero dev-only routes. Zero test doubles in
 * production code. The only bootstrap is the pre-generated credential
 * row, which is byte-for-byte identical to what real registration would
 * have inserted.
 *
 * **Two-step workflow.**
 *
 * 1. In your seed script, call {@link generateTestPasskey} to produce a
 *    keypair + a pre-built `seedRow` ready to insert into the `passkeys`
 *    table. Persist the `privateKey` + `credentialId` to a fixture file
 *    so tests can read them later.
 * 2. In your Playwright test, call {@link addPasskeyCredential} with the
 *    fixture values. This attaches a virtual authenticator to the page
 *    and registers the credential, so the next WebAuthn call from the
 *    app resolves against it.
 *
 * @example Seed script (runs once, before tests)
 * ```ts
 * import { generateTestPasskey } from "@cfast/auth/test-helpers/passkey";
 * import { drizzle } from "drizzle-orm/d1";
 * import { users, passkeys } from "@cfast/auth/schema";
 * import fs from "node:fs/promises";
 *
 * const alice = await generateTestPasskey({
 *   userId: "user-alice",
 *   rpId: "localhost",
 * });
 *
 * const db = drizzle(env.DB);
 * await db.insert(users).values({
 *   id: "user-alice",
 *   email: "alice@test.com",
 *   name: "Alice",
 *   emailVerified: true,
 * });
 * await db.insert(passkeys).values(alice.seedRow);
 *
 * // Save just the bits the test needs — never commit these as real
 * // credentials, but they are safe because they're only valid against
 * // the seeded passkeys row.
 * await fs.writeFile(
 *   "tests/fixtures/alice-passkey.json",
 *   JSON.stringify({
 *     credentialId: alice.credentialId,
 *     privateKey: alice.privateKey,
 *     rpId: "localhost",
 *     userHandle: "user-alice",
 *   }),
 * );
 * ```
 *
 * @example Playwright test (uses the fixture)
 * ```ts
 * import { test, expect } from "@playwright/test";
 * import { addPasskeyCredential } from "@cfast/auth/test-helpers/passkey";
 * import alicePasskey from "../fixtures/alice-passkey.json";
 *
 * test("alice can sign in with a passkey", async ({ page }) => {
 *   await addPasskeyCredential(page, alicePasskey);
 *   await page.goto("/login");
 *   await page.getByRole("button", { name: /sign in with passkey/i }).click();
 *   await expect(page).toHaveURL("/workspaces");
 * });
 * ```
 */

// Node's webcrypto is the same interface as globalThis.crypto in modern
// Node + workerd, so we go through globalThis to stay runtime-agnostic.
// Consumers calling `generateTestPasskey()` from a seed script run on
// Node ≥ 20 where `globalThis.crypto.subtle` is always available.
const subtle = (): SubtleCrypto => {
  const s = (globalThis.crypto as Crypto | undefined)?.subtle;
  if (!s) {
    throw new Error(
      "[cfast/auth/test-helpers/passkey] globalThis.crypto.subtle is not available. " +
        "generateTestPasskey() requires Node ≥ 20 or a modern browser.",
    );
  }
  return s;
};

/**
 * Options for {@link generateTestPasskey}.
 */
export type GenerateTestPasskeyOptions = {
  /**
   * The ID of the user this passkey belongs to. MUST match an existing
   * row in the `users` table when the returned `seedRow` is inserted —
   * the foreign key to `users.id` is enforced by the schema.
   */
  userId: string;
  /**
   * The WebAuthn Relying Party ID your app uses. For local development
   * this is almost always `"localhost"`. Must match the `rpId` passed to
   * `createAuth({ passkeys: { rpId } })` and the `rpId` passed to
   * {@link addPasskeyCredential} in the test.
   */
  rpId: string;
  /**
   * Optional friendly name shown on the passkey management UI ("name"
   * column in the `passkeys` table). Defaults to `"Test Passkey"`.
   */
  name?: string;
  /**
   * Optional pre-generated credential ID (base64url). Pass this when you
   * want reproducible seeds across test runs — otherwise a random 16-byte
   * ID is generated fresh every call.
   */
  credentialId?: string;
  /**
   * Optional AAGUID for the authenticator. Defaults to the all-zero
   * AAGUID (`"00000000-0000-0000-0000-000000000000"`) which signals an
   * unattested authenticator, matching what Chrome's virtual authenticator
   * reports.
   */
  aaguid?: string;
  /**
   * Optional `transports` string stored in the `passkeys` row. Defaults
   * to `"internal"` (the transport Chrome's virtual authenticator uses).
   * Better Auth's `passkeys` schema stores this as a comma-delimited
   * string because the Drizzle column is TEXT; we match that convention.
   */
  transports?: string;
};

/**
 * The shape of a `passkeys` row ready to insert via Drizzle.
 *
 * Matches `packages/auth/src/schema.ts` exactly — the field names are the
 * Drizzle property names (camelCase), not the underlying column names.
 */
export type PasskeySeedRow = {
  /** Primary key for the passkey row. Random base64url by default. */
  id: string;
  /** Display name. Nullable in the schema, never null here. */
  name: string;
  /** FK into `users.id`. */
  userId: string;
  /**
   * The COSE-encoded public key bytes, base64-encoded **with** padding.
   * Better Auth's passkey plugin stores keys via
   * `base64.encode(credential.publicKey)` (standard base64, padded) and
   * then decodes with `base64.decode(...)` before calling the
   * `@simplewebauthn/server` verifier, so we produce exactly that format
   * here.
   */
  publicKey: string;
  /**
   * The credential identifier, base64url-encoded (no padding). This must
   * match the `credentialId` returned by the WebAuthn `navigator.credentials.get`
   * call during authentication — Chrome's virtual authenticator round-trips
   * the bytes unchanged, so the same value is what we pass to
   * {@link addPasskeyCredential}.
   */
  credentialID: string;
  /** Always `0` on a freshly generated credential. */
  counter: number;
  /**
   * `"singleDevice"` or `"multiDevice"`. Chrome's virtual authenticator
   * reports `"singleDevice"` when `hasResidentKey` is set, so we use that
   * by default to match what real registration would write.
   */
  deviceType: "singleDevice" | "multiDevice";
  /** Synced to a cloud provider. Virtual authenticator returns false. */
  backedUp: boolean;
  /** Comma-delimited transports (e.g., `"internal"`). */
  transports: string;
  /** Authenticator AAGUID. All zeros for unattested (virtual). */
  aaguid: string;
  /** Creation timestamp. Set to now. */
  createdAt: Date;
};

/**
 * The return value of {@link generateTestPasskey}.
 *
 * Contains everything the seed script needs (`seedRow` for the DB insert)
 * plus everything the Playwright test needs (`credentialId`, `privateKey`).
 */
export type GeneratedTestPasskey = {
  /**
   * The credential ID, base64url-encoded (no padding). Pass this to
   * {@link addPasskeyCredential} so Chrome's virtual authenticator knows
   * which credential to expose during `navigator.credentials.get()`.
   */
  credentialId: string;
  /**
   * The public key, base64url-encoded COSE bytes. Useful for logging or
   * asserting shape in unit tests — the DB storage format lives in
   * {@link PasskeySeedRow.publicKey} (standard base64, padded) to match
   * what Better Auth expects to read back.
   */
  publicKey: string;
  /**
   * The private key in PKCS#8 format, base64-encoded **with** padding.
   * This is the format `WebAuthn.addCredential` (CDP) expects — Playwright
   * passes it straight through to Chrome. Do NOT commit real production
   * private keys in fixtures; these are scoped to the test seed and have
   * no value outside of the virtual authenticator.
   */
  privateKey: string;
  /**
   * A ready-to-insert row for the `passkeys` Drizzle table. The column
   * shape matches {@link passkeys} in `@cfast/auth/schema` exactly, so
   * `db.insert(passkeys).values(result.seedRow)` works without massaging.
   */
  seedRow: PasskeySeedRow;
};

/**
 * Generates a fresh ES256 passkey credential suitable for seeding a test
 * database and driving a Playwright virtual authenticator.
 *
 * The generated credential uses the same parameters Better Auth's passkey
 * plugin defaults to (ES256 / P-256), produces a COSE-encoded public key
 * that `@simplewebauthn/server`'s verifier round-trips losslessly, and
 * returns a `seedRow` whose fields map 1:1 to the `passkeys` Drizzle
 * schema.
 *
 * **The generated credential is a real WebAuthn credential.** The private
 * key IS a usable private key — it's just one that nobody will ever use
 * outside of tests because it's never bound to a user's real device. For
 * this reason the helper is safe to use in CI fixtures, but the fixture
 * files should still live under `tests/` rather than being published.
 *
 * @example
 * ```ts
 * const alice = await generateTestPasskey({
 *   userId: "user-alice",
 *   rpId: "localhost",
 * });
 * console.log(alice.credentialId); // "abc123..." (base64url)
 * console.log(alice.seedRow.publicKey); // "pQECAyYgASFYIP..." (base64, padded)
 * ```
 */
export async function generateTestPasskey(
  options: GenerateTestPasskeyOptions,
): Promise<GeneratedTestPasskey> {
  const keyPair = (await subtle().generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;

  // Export the public key in "raw" SEC1 uncompressed point form:
  // 0x04 || X (32 bytes) || Y (32 bytes). This is the easiest format to
  // split into the COSE `x` and `y` coordinates.
  const rawPub = new Uint8Array(await subtle().exportKey("raw", keyPair.publicKey));
  if (rawPub.length !== 65 || rawPub[0] !== 0x04) {
    throw new Error(
      `[cfast/auth/test-helpers/passkey] unexpected raw public key shape: ` +
        `length=${rawPub.length}, first byte=${rawPub[0]?.toString(16)}`,
    );
  }
  const x = rawPub.slice(1, 33);
  const y = rawPub.slice(33, 65);

  // Hand-rolled COSE CBOR encoding. A COSE ES256 public key is a 5-entry
  // CBOR map:
  //   1 (kty)  -> 2 (EC2)
  //   3 (alg)  -> -7 (ES256)
  //   -1 (crv) -> 1 (P-256)
  //   -2 (x)   -> bstr(32)
  //   -3 (y)   -> bstr(32)
  // This is small enough (<50 lines) that it's cleaner to hand-roll than
  // to add `@simplewebauthn/server` as a peer dependency just for
  // `isoCBOR.encode()`. We do verify the output shape in the unit test
  // by decoding it back via the actual simplewebauthn CBOR helper.
  const coseKey = encodeCoseEs256Key(x, y);

  // Random 16-byte credential ID unless the caller pinned one for
  // reproducible seeds.
  const credentialIdBytes =
    options.credentialId !== undefined
      ? base64UrlDecode(options.credentialId)
      : randomBytes(16);
  const credentialId = base64UrlEncode(credentialIdBytes);

  // Private key: export as PKCS#8 and base64-encode (standard base64,
  // padded). Chrome's CDP `WebAuthn.addCredential` expects exactly this
  // format (https://chromedevtools.github.io/devtools-protocol/tot/WebAuthn/#type-Credential).
  const pkcs8 = new Uint8Array(
    await subtle().exportKey("pkcs8", keyPair.privateKey),
  );
  const privateKey = base64Encode(pkcs8);

  const name = options.name ?? "Test Passkey";
  const transports = options.transports ?? "internal";
  const aaguid = options.aaguid ?? "00000000-0000-0000-0000-000000000000";

  const seedRow: PasskeySeedRow = {
    id: base64UrlEncode(randomBytes(16)),
    name,
    userId: options.userId,
    publicKey: base64Encode(coseKey),
    credentialID: credentialId,
    counter: 0,
    deviceType: "singleDevice",
    backedUp: false,
    transports,
    aaguid,
    createdAt: new Date(),
  };

  return {
    credentialId,
    publicKey: base64UrlEncode(coseKey),
    privateKey,
    seedRow,
  };
}

/**
 * The minimal shape of Playwright's `Page` we rely on. Typed structurally
 * so this module can be imported from a seed script that has no Playwright
 * installed — the type widens to "anything with the right methods".
 *
 * @internal
 */
type PlaywrightPageLike = {
  context(): {
    newCDPSession: (page: PlaywrightPageLike) => Promise<CDPSessionLike>;
  };
};

/**
 * The minimal shape of a Playwright CDP session we rely on.
 *
 * @internal
 */
type CDPSessionLike = {
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
  detach?: () => Promise<void>;
};

/**
 * Options for {@link addPasskeyCredential}.
 */
export type AddPasskeyCredentialOptions = {
  /**
   * The credential ID from {@link generateTestPasskey}, base64url-encoded.
   * This is what the virtual authenticator returns to
   * `navigator.credentials.get()`.
   */
  credentialId: string;
  /**
   * The PKCS#8 private key from {@link generateTestPasskey}, base64-encoded
   * (standard, padded). Chrome's virtual authenticator signs WebAuthn
   * challenges with this key.
   */
  privateKey: string;
  /**
   * The Relying Party ID. Must match the `rpId` you passed to
   * {@link generateTestPasskey} and the one configured on the server side
   * via `createAuth({ passkeys: { rpId } })`.
   */
  rpId: string;
  /**
   * The user handle to associate with the credential. This ends up in
   * the `userHandle` field of `PublicKeyCredentialUserEntity` during
   * authentication. For cfast seeds, use the same `userId` you passed
   * to {@link generateTestPasskey} so Better Auth can correlate the
   * credential back to the user row.
   */
  userHandle: string;
  /**
   * Optional starting counter. Defaults to `0`. Increment this if you
   * are testing counter-increment logic across multiple logins.
   */
  signCount?: number;
  /**
   * Whether the credential should be registered as a resident (discoverable)
   * credential. Defaults to `true` — required for usernameless login
   * flows like the one Better Auth exposes by default.
   */
  isResidentCredential?: boolean;
};

/**
 * Result of {@link addPasskeyCredential}.
 */
export type AddPasskeyCredentialResult = {
  /**
   * The virtual authenticator ID returned by Chrome. Pass this to
   * {@link cleanupTestAuthenticator} if you want to tear the authenticator
   * down mid-test (e.g., to test the "user has no passkey" code path).
   */
  authenticatorId: string;
  /**
   * Convenience cleanup function that calls {@link cleanupTestAuthenticator}
   * with the authenticator ID captured above. Safe to call even if the
   * test already tore the authenticator down — no-ops on "not found".
   */
  cleanup: () => Promise<void>;
};

/**
 * Attaches a Chrome virtual authenticator to the given Playwright page
 * and registers the credential returned by {@link generateTestPasskey}.
 *
 * After this call, any subsequent WebAuthn API call from the page (e.g.,
 * `navigator.credentials.get()` when the user clicks "Sign in with passkey")
 * will be intercepted by the virtual authenticator and resolved against
 * the registered credential. Chrome signs the challenge with the real
 * private key, the signature flows through to Better Auth's
 * `/passkey/verify-authentication` endpoint, and the endpoint verifies
 * it against the COSE public key stored in the `passkeys` row — the
 * entire production code path runs untouched.
 *
 * The virtual authenticator lives on the page's CDP session, so it is
 * automatically cleaned up when the Playwright context closes. The
 * returned `cleanup` function is only necessary when tests want to
 * remove the authenticator mid-test.
 *
 * @throws If the CDP commands fail (e.g., the browser is not Chromium).
 *
 * @example Per-test fixture
 * ```ts
 * import { test as base } from "@playwright/test";
 * import { addPasskeyCredential } from "@cfast/auth/test-helpers/passkey";
 * import alicePasskey from "../fixtures/alice-passkey.json";
 *
 * export const test = base.extend<{ aliceAuthed: void }>({
 *   aliceAuthed: [
 *     async ({ page }, use) => {
 *       const { cleanup } = await addPasskeyCredential(page, alicePasskey);
 *       await use();
 *       await cleanup();
 *     },
 *     { auto: true },
 *   ],
 * });
 * ```
 */
export async function addPasskeyCredential(
  page: PlaywrightPageLike,
  options: AddPasskeyCredentialOptions,
): Promise<AddPasskeyCredentialResult> {
  const session = await page.context().newCDPSession(page);

  // Turn on the Web Platform Virtual Authenticator for this target. No-op
  // if already enabled, so test fixtures can call this idempotently.
  await session.send("WebAuthn.enable", {});

  // Create a virtual authenticator that looks like an internal platform
  // authenticator (Touch ID / Windows Hello) with user verification always
  // succeeding. `ctap2` is required for resident-credential support.
  const addAuthResult = (await session.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })) as { authenticatorId: string };
  const authenticatorId = addAuthResult.authenticatorId;

  // Register the credential against the authenticator. Chrome's CDP
  // `WebAuthn.addCredential` expects ALL byte fields (`credentialId`,
  // `privateKey`, `userHandle`) as **standard base64 with padding**, not
  // base64url. `generateTestPasskey()` emits the credentialId as base64url
  // (because that's the format WebAuthn JS / Better Auth round-trips), so
  // we normalize it back to standard base64 here. The privateKey is
  // already standard base64. The userHandle is a plain string we
  // base64-encode in place.
  //
  // Originally landed in @cfast/auth 0.4.0 with the credentialId passed
  // through unchanged, which made the CDP call fail with `Invalid
  // parameters` on Chromium ≥ 131. Tracked at #210.
  await session.send("WebAuthn.addCredential", {
    authenticatorId,
    credential: {
      credentialId: base64UrlToBase64(options.credentialId),
      isResidentCredential: options.isResidentCredential ?? true,
      rpId: options.rpId,
      privateKey: options.privateKey,
      userHandle: base64Encode(new TextEncoder().encode(options.userHandle)),
      signCount: options.signCount ?? 0,
    },
  });

  return {
    authenticatorId,
    cleanup: async () => {
      await cleanupTestAuthenticator(page, authenticatorId).catch(() => {
        // Swallow "authenticator not found" so cleanup is idempotent.
      });
    },
  };
}

/**
 * Removes a virtual authenticator previously created by
 * {@link addPasskeyCredential}.
 *
 * Useful for tests that need to verify "user without a passkey is
 * redirected to register" — first add the authenticator to get a
 * logged-in baseline, then remove it and reload to simulate the
 * unregistered state.
 *
 * Swallows "authenticator not found" errors so callers can call this
 * unconditionally in teardown.
 */
export async function cleanupTestAuthenticator(
  page: PlaywrightPageLike,
  authenticatorId: string,
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send("WebAuthn.removeVirtualAuthenticator", {
    authenticatorId,
  });
}

// ---------------------------------------------------------------------
// Internal encoding helpers
// ---------------------------------------------------------------------

/**
 * Encodes an ES256 (P-256) public key in COSE CBOR format.
 *
 * The output is a 5-entry CBOR map matching the canonical COSE_Key
 * structure Better Auth / simplewebauthn produces during real passkey
 * registration. Keys use "small int" major types (short form) and the
 * 32-byte coordinates use the "byte string, 1-byte length" form (0x58 0x20).
 *
 * This keeps the encoder deliberately specific to the ES256 case — we
 * don't need a general CBOR encoder, just one that produces bytes
 * decodeable by the real verifier.
 *
 * @internal
 */
function encodeCoseEs256Key(x: Uint8Array, y: Uint8Array): Uint8Array {
  if (x.length !== 32 || y.length !== 32) {
    throw new Error(
      `[cfast/auth/test-helpers/passkey] P-256 coordinates must be 32 bytes each, got x=${x.length} y=${y.length}`,
    );
  }

  const out: number[] = [];
  // Map with 5 entries: major type 5 (0b101_00000) | 5 = 0xa5.
  out.push(0xa5);

  // Key 1 (kty) = 2 (EC2)
  // CBOR uint 1 = 0x01, uint 2 = 0x02
  out.push(0x01, 0x02);

  // Key 3 (alg) = -7 (ES256)
  // CBOR uint 3 = 0x03. CBOR negative int -n = (major 1 << 5) | (n-1).
  // -7 => major 1, value 6 => 0x20 | 0x06 = 0x26
  out.push(0x03, 0x26);

  // Key -1 (crv) = 1 (P-256)
  // CBOR negint -1 => 0x20. uint 1 => 0x01
  out.push(0x20, 0x01);

  // Key -2 (x) = bstr(32)
  // CBOR negint -2 => 0x21. bstr with 1-byte length => 0x58, length 32 => 0x20
  out.push(0x21, 0x58, 0x20);
  for (const b of x) out.push(b);

  // Key -3 (y) = bstr(32)
  // CBOR negint -3 => 0x22.
  out.push(0x22, 0x58, 0x20);
  for (const b of y) out.push(b);

  return new Uint8Array(out);
}

/**
 * Cryptographically secure random byte generator. Wraps
 * `globalThis.crypto.getRandomValues` so the helper stays runtime-agnostic.
 *
 * @internal
 */
function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  const c = globalThis.crypto as Crypto | undefined;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error(
      "[cfast/auth/test-helpers/passkey] globalThis.crypto.getRandomValues is not available",
    );
  }
  c.getRandomValues(out);
  return out;
}

/**
 * Standard base64 encoder, padded. Matches the format Better Auth's
 * passkey plugin uses when writing `passkeys.public_key` and the format
 * Chrome's CDP `WebAuthn.addCredential` expects for `privateKey`.
 *
 * We hand-roll this to avoid a dependency on Node's `Buffer` (the helper
 * should run under workerd and browser contexts too).
 *
 * @internal
 */
function base64Encode(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  let i = 0;
  for (; i + 3 <= bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1]!;
    const b2 = bytes[i + 2]!;
    out += alphabet[b0 >> 2];
    out += alphabet[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += alphabet[((b1 & 0x0f) << 2) | (b2 >> 6)];
    out += alphabet[b2 & 0x3f];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const b0 = bytes[i]!;
    out += alphabet[b0 >> 2];
    out += alphabet[(b0 & 0x03) << 4];
    out += "==";
  } else if (remaining === 2) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1]!;
    out += alphabet[b0 >> 2];
    out += alphabet[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += alphabet[(b1 & 0x0f) << 2];
    out += "=";
  }
  return out;
}

/**
 * URL-safe base64 encoder, no padding. The format WebAuthn uses for
 * credential IDs and the format `WebAuthn.addCredential`'s `credentialId`
 * field expects.
 *
 * @internal
 */
function base64UrlEncode(bytes: Uint8Array): string {
  return base64Encode(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Re-pad and re-alphabet a base64url string back to standard base64. The
 * Chrome DevTools Protocol's `WebAuthn.addCredential` API rejects the
 * URL-safe variant with `Invalid parameters`, so we normalize on the way
 * into CDP.
 *
 * Idempotent on already-standard base64 input — `+/` are passed through
 * unchanged and existing padding is preserved.
 *
 * @internal
 */
function base64UrlToBase64(value: string): string {
  const replaced = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (replaced.length % 4)) % 4;
  return replaced + "=".repeat(padLen);
}

/**
 * URL-safe base64 decoder. Used only when the caller pinned a
 * `credentialId` for reproducible seeds — we need to validate it's
 * decodable to fail fast on malformed input.
 *
 * @internal
 */
function base64UrlDecode(value: string): Uint8Array {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i++) lookup.set(alphabet[i]!, i);

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of padded) {
    if (ch === "=") break;
    const v = lookup.get(ch);
    if (v === undefined) {
      throw new Error(
        `[cfast/auth/test-helpers/passkey] invalid base64url character in credentialId: ${ch}`,
      );
    }
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}
