import { useComponent } from "../plugin.js";
import type { BooleanFieldProps } from "../types.js";

/**
 * Read-only display component that renders a boolean value as a colored chip.
 *
 * Uses the plugin's `chip` slot (via {@link useComponent}) for styling.
 * Displays customizable labels and colors for `true` and `false` states.
 * Returns an em-dash for null/undefined values.
 *
 * @param props - See {@link BooleanFieldProps}.
 * @returns A styled chip element, or a placeholder `<span>` for null values.
 *
 * @example
 * ```tsx
 * <BooleanField value={post.published} trueLabel="Published" falseLabel="Draft" />
 * // -> Green chip: "Published" or neutral chip: "Draft"
 * ```
 */
export function BooleanField({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
  trueColor = "success",
  falseColor = "neutral",
}: BooleanFieldProps) {
  const Chip = useComponent("chip");

  if (value == null) {
    return <span>—</span>;
  }

  return (
    <Chip
      color={(value ? trueColor : falseColor) as "success" | "neutral" | "danger" | "primary" | "warning"}
      variant="soft"
      size="sm"
    >
      {value ? trueLabel : falseLabel}
    </Chip>
  );
}
