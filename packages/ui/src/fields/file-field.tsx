import { createElement } from "react";
import type { FileFieldProps } from "../types.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileField({
  value,
  fileName,
  fileSize,
}: FileFieldProps) {
  if (value == null) {
    return createElement("span", null, "—");
  }

  const name = fileName ?? value;
  const sizeStr = fileSize != null ? ` (${formatBytes(fileSize)})` : "";

  return createElement("span", null, `📄 ${name}${sizeStr}`);
}
