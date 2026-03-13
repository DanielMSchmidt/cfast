import type { ReactNode } from "react";
import { useComponent } from "../plugin.js";
import type { FormStatusProps } from "../types.js";

/**
 * Displays action result feedback (success, error, and field-level validation messages).
 *
 * Renders alerts via the UI plugin's `alert` slot. Success messages are shown
 * in green, errors in red, and field-level validation errors as a bulleted list.
 * Returns `null` when there is no feedback to display.
 *
 * @param props - See {@link FormStatusProps}.
 *
 * @example
 * ```tsx
 * function EditForm() {
 *   const actionData = useActionData();
 *   return (
 *     <Form method="post">
 *       <FormStatus data={actionData} />
 *       ...
 *     </Form>
 *   );
 * }
 * ```
 */
export function FormStatus({ data }: FormStatusProps) {
  const Alert = useComponent("alert");

  if (!data) return null;

  const elements: ReactNode[] = [];

  if (data.success) {
    elements.push(
      <Alert key="success" color="success">{data.success}</Alert>,
    );
  }

  if (data.error) {
    elements.push(
      <Alert key="error" color="danger">{data.error}</Alert>,
    );
  }

  if (data.fieldErrors) {
    const errorMessages = Object.entries(data.fieldErrors)
      .flatMap(([field, errors]) =>
        errors.map((err) => `${field}: ${err}`),
      );
    if (errorMessages.length > 0) {
      elements.push(
        <Alert key="field-errors" color="danger">
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

  return <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>{elements}</div>;
}
