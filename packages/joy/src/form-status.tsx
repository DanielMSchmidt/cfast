import { type ReactElement } from "react";
import Alert from "@mui/joy/Alert";
import Stack from "@mui/joy/Stack";
import type { FormStatusProps } from "@cfast/ui";

/**
 * Joy UI FormStatus — displays action result feedback as Joy Alerts.
 */
export function FormStatus({ data }: FormStatusProps): ReactElement | null {
  if (!data) return null;

  const elements: ReactElement[] = [];

  if (data.success) {
    elements.push(
      <Alert key="success" color="success" variant="soft">{data.success}</Alert>,
    );
  }

  if (data.error) {
    elements.push(
      <Alert key="error" color="danger" variant="soft">{data.error}</Alert>,
    );
  }

  if (data.fieldErrors) {
    const errorMessages = Object.entries(data.fieldErrors)
      .flatMap(([field, errors]) =>
        errors.map((err) => `${field}: ${err}`),
      );
    if (errorMessages.length > 0) {
      elements.push(
        <Alert key="field-errors" color="danger" variant="soft">
          <ul style={{ margin: 0, paddingLeft: "16px" }}>
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </Alert>,
      );
    }
  }

  if (elements.length === 0) return null;

  return <Stack spacing={1}>{elements}</Stack>;
}
