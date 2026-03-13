import type { ImageFieldProps } from "../types.js";

/**
 * Read-only display component that renders an image thumbnail.
 *
 * Displays the image at the specified dimensions with `object-fit: cover` and
 * rounded corners. Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link ImageFieldProps}.
 * @returns An `<img>` element, or a placeholder `<span>` for null values.
 *
 * @example
 * ```tsx
 * <ImageField value={post.coverImageUrl} width={120} height={80} alt="Cover" />
 * ```
 */
export function ImageField({
  value,
  width = 80,
  height = 60,
  alt = "",
}: ImageFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  return (
    <img
      src={value}
      alt={alt}
      width={width}
      height={height}
      style={{ objectFit: "cover" as const, borderRadius: "4px" }}
    />
  );
}
