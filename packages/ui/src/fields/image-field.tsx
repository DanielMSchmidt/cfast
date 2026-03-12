import type { ImageFieldProps } from "../types.js";

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
