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

  const boolValue = Boolean(value);
  const color = boolValue ? trueColor : falseColor;
  const chipColor = isChipColor(color) ? color : "neutral";

  return (
    <Chip
      color={chipColor}
      variant="soft"
      size="sm"
    >
      {boolValue ? trueLabel : falseLabel}
    </Chip>
  );
}

const CHIP_COLORS = new Set<string>(["success", "neutral", "danger", "primary", "warning"]);

function isChipColor(
  value: string,
): value is "success" | "neutral" | "danger" | "primary" | "warning" {
  return CHIP_COLORS.has(value);
}
