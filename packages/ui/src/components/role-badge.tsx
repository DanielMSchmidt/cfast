import { useComponent } from "../plugin.js";
import type { RoleBadgeProps, ChipSlotProps } from "../types.js";

const defaultColors: Record<string, ChipSlotProps["color"]> = {
  admin: "danger",
  editor: "primary",
  author: "success",
  reader: "neutral",
};

/**
 * Colored badge displaying a user's role name.
 *
 * Renders via the UI plugin's `chip` slot. Default color mapping:
 * admin = danger, editor = primary, author = success, reader = neutral.
 * Pass a custom `colors` map to override or extend the defaults.
 *
 * @param props - See {@link RoleBadgeProps}.
 *
 * @example
 * ```tsx
 * <RoleBadge role="admin" />
 * // Custom colors:
 * <RoleBadge role="moderator" colors={{ moderator: "warning" }} />
 * ```
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
