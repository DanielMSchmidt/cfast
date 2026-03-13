import { describe, it } from "vitest";

// Multipart upload requires each part (except the last) to be at least 5MB per
// the R2/S3 spec. Miniflare enforces this constraint, so we cannot meaningfully
// test the multipart code path without uploading 10MB+ of data per test, which
// is too slow and memory-heavy for the integration suite.
//
// The multipart logic is covered by unit tests in packages/storage/src/__tests__/upload.test.ts
// which use a mocked R2 bucket without the minimum part size constraint.
describe("multipart", () => {
  it.skip("file above multipartThreshold auto-uses multipart (requires real R2 or large payload)", () => {
    // Intentionally skipped — see comment above.
  });
});
