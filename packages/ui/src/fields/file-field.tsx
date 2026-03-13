import type { FileFieldProps } from "../types.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Read-only display component that renders a file reference with an icon,
 * display name, and optional formatted file size.
 *
 * Uses `fileName` if provided, otherwise falls back to the raw `value` string.
 * File sizes are formatted as B/KB/MB. Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link FileFieldProps}.
 * @returns A `<span>` with a file icon, name, and size, or a placeholder for null values.
 *
 * @example
 * ```tsx
 * <FileField value="report.pdf" fileName="Q4 Report.pdf" fileSize={2048576} />
 * // -> "Q4 Report.pdf (2.0 MB)"
 * ```
 */
export function FileField({
  value,
  fileName,
  fileSize,
}: FileFieldProps) {
  if (value == null) {
    return <span>—</span>;
  }

  const name = fileName ?? value;
  const sizeStr = fileSize != null ? ` (${formatBytes(fileSize)})` : "";

  return <span>{`\u{1F4C4} ${name}${sizeStr}`}</span>;
}
