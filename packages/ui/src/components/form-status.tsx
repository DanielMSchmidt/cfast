import { createElement, type ReactNode } from "react";
import { useComponent } from "../plugin.js";
import type { FormStatusProps } from "../types.js";

/**
 * Displays action result feedback (success/error messages) using the
 * plugin's `alert` slot.
 */
export function FormStatus({ data }: FormStatusProps) {
  const Alert = useComponent("alert");

  if (!data) return null;

  const elements: ReactNode[] = [];

  if (data.success) {
    elements.push(
      createElement(Alert, { key: "success", color: "success", children: data.success }),
    );
  }

  if (data.error) {
    elements.push(
      createElement(Alert, { key: "error", color: "danger", children: data.error }),
    );
  }

  if (data.fieldErrors) {
    const errorMessages = Object.entries(data.fieldErrors)
      .flatMap(([field, errors]) =>
        errors.map((err) => `${field}: ${err}`),
      );
    if (errorMessages.length > 0) {
      elements.push(
        createElement(Alert, {
          key: "field-errors",
          color: "danger",
          children: createElement(
            "ul",
            { style: { margin: 0, paddingLeft: "16px" } },
            ...errorMessages.map((msg, i) =>
              createElement("li", { key: i }, msg),
            ),
          ),
        }),
      );
    }
  }

  if (elements.length === 0) return null;

  return createElement("div", { style: { display: "flex", flexDirection: "column" as const, gap: "8px" } }, ...elements);
}
