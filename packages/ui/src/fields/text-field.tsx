import { createElement } from "react";
import type { TextFieldProps } from "../types.js";

export function TextField({
  value,
  maxLength,
}: TextFieldProps) {
  if (value == null) {
    return createElement("span", null, "—");
  }

  const display = maxLength && value.length > maxLength
    ? `${value.slice(0, maxLength)}…`
    : value;

  if (maxLength && value.length > maxLength) {
    return createElement("span", { title: value }, display);
  }

  return createElement("span", null, display);
}
