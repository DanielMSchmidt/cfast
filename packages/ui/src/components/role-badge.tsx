import { useComponent } from "../plugin.js";
import type { RoleBadgeProps, ChipSlotProps } from "../types.js";

const defaultColors: Record<string, ChipSlotProps["color"]> = {
  admin: "danger",
  editor: "primary",
  author: "success",
  reader: "neutral",
};

/**
 * Colored badge displaying a user's role.
 * Uses the plugin's `chip` slot for rendering.
 */
export function RoleBadge({ role, colors }: RoleBadgeProps) {
  const Chip = useComponent("chip");
  const colorMap = colors
    ? { ...defaultColors, ...Object.fromEntries(
        Object.entries(colors).map(([k, v]) => [k, v as ChipSlotProps["color"]]),
      )}
    : defaultColors;
  const chipColor = colorMap[role] ?? "neutral";

  return (
    <Chip color={chipColor} variant="soft" size="sm">
      {role}
    </Chip>
  );
}
