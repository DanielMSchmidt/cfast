import type { ImagePreviewProps } from "../types.js";

/**
 * Displays an image from `@cfast/storage` or a direct URL.
 *
 * Resolves the display URL from either a direct `src`, or a `fileKey` + `getUrl`
 * resolver function (for signed URL generation). Shows a placeholder when no
 * image is available, or renders the `fallback` element if provided.
 *
 * @param props - See {@link ImagePreviewProps}.
 *
 * @example
 * ```tsx
 * <ImagePreview
 *   fileKey={post.coverImageKey}
 *   getUrl={(key) => storage.getSignedUrl(key)}
 *   width={200}
 *   height={150}
 *   fallback={<PlaceholderImage />}
 * />
 * ```
 */
export function ImagePreview({
  fileKey,
  src,
  getUrl,
  width = 200,
  height = 200,
  fallback,
  alt = "Image preview",
}: ImagePreviewProps) {
  const resolvedSrc = src ?? (fileKey && getUrl ? getUrl(fileKey) : null);

  if (!resolvedSrc) {
    return fallback ? (
      <div>{fallback}</div>
    ) : (
      <div
        style={{
          width,
          height,
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          color: "#999",
        }}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      style={{
        width,
        height,
        objectFit: "cover" as const,
        borderRadius: "4px",
      }}
    />
  );
}
