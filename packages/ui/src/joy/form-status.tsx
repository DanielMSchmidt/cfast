import { createElement, type ReactElement } from "react";
import Alert from "@mui/joy/Alert";
import Stack from "@mui/joy/Stack";
import type { FormStatusProps } from "../types.js";

/**
 * Joy UI FormStatus — displays action result feedback as Joy Alerts.
 */
export function FormStatus({ data }: FormStatusProps): ReactElement | null {
  if (!data) return null;

  const elements: ReactElement[] = [];

  if (data.success) {
    elements.push(
      createElement(Alert, { key: "success", color: "success", variant: "soft", children: data.success }),
    );
  }

  if (data.error) {
    elements.push(
      createElement(Alert, { key: "error", color: "danger", variant: "soft", children: data.error }),
    );
  }

  if (data.fieldErrors) {
    const errorMessages = Object.entries(data.fieldErrors)
      .flatMap(([field, errors]) =>
        errors.map((err) => `${field}: ${err}`),
      );
    if (errorMessages.length > 0) {
      elements.push(
        createElement(
          Alert,
          { key: "field-errors", color: "danger", variant: "soft" },
          createElement(
            "ul",
            { style: { margin: 0, paddingLeft: "16px" } },
            ...errorMessages.map((msg, i) =>
              createElement("li", { key: i }, msg),
            ),
          ),
        ),
      );
    }
  }

  if (elements.length === 0) return null;

  return createElement(Stack, { spacing: 1 }, ...elements);
}
