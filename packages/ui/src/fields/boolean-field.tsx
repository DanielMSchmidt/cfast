import { createElement } from "react";
import { useComponent } from "../plugin.js";
import type { BooleanFieldProps } from "../types.js";

export function BooleanField({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
  trueColor = "success",
  falseColor = "neutral",
}: BooleanFieldProps) {
  const Chip = useComponent("chip");

  if (value == null) {
    return createElement("span", null, "—");
  }

  return createElement(Chip, {
    children: value ? trueLabel : falseLabel,
    color: (value ? trueColor : falseColor) as "success" | "neutral" | "danger" | "primary" | "warning",
    variant: "soft",
    size: "sm",
  });
}
