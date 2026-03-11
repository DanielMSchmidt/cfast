import { createElement } from "react";
import type { RelationFieldProps } from "../types.js";

export function RelationField({
  value,
  display = "name",
  linkTo,
}: RelationFieldProps) {
  if (value == null) {
    return createElement("span", null, "—");
  }

  const record = value as Record<string, unknown>;
  const displayValue = String(record[display] ?? record.id ?? value);
  const id = record.id as string | undefined;

  if (linkTo && id) {
    const href = linkTo.replace(":id", id);
    return createElement("a", { href }, displayValue);
  }

  return createElement("span", null, displayValue);
}
