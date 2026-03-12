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
