import { createElement } from "react";
import type { ImageFieldProps } from "../types.js";

export function ImageField({
  value,
  width = 80,
  height = 60,
  alt = "",
}: ImageFieldProps) {
  if (value == null) {
    return createElement("span", null, "—");
  }

  return createElement("img", {
    src: value,
    alt,
    width,
    height,
    style: { objectFit: "cover" as const, borderRadius: "4px" },
  });
}
