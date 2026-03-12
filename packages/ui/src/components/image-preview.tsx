import type { ImagePreviewProps } from "../types.js";

/**
 * Headless ImagePreview — displays an image from storage or direct src.
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
