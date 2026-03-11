import { createElement } from "react";
import type { EmailFieldProps } from "../types.js";

export function EmailField({ value }: EmailFieldProps) {
  if (value == null) {
    return createElement("span", null, "—");
  }

  return createElement("a", { href: `mailto:${value}` }, value);
}
