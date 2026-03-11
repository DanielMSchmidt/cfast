export type MagicSignature = {
  mime: string;
  bytes: number[];
  offset?: number;
};

export const SIGNATURES: readonly MagicSignature[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  {
    mime: "image/png",
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  // WebP: starts with RIFF, then 4 bytes of file size, then WEBP
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

export function detectMimeType(header: Uint8Array): string | null {
  if (header.length === 0) return null;

  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (header.length < offset + sig.bytes.length) continue;

    const matches = sig.bytes.every((b, i) => header[offset + i] === b);
    if (!matches) continue;

    // Special case: WebP needs a second check at offset 8
    if (sig.mime === "image/webp") {
      if (header.length < 12) continue;
      const webpMatch = WEBP_MARKER.every((b, i) => header[8 + i] === b);
      if (!webpMatch) continue;
    }

    return sig.mime;
  }

  return null;
}

/** Maximum number of bytes needed to detect any known signature */
export const MAX_HEADER_SIZE = 12;
