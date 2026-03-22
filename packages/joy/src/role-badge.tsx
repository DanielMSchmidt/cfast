import { type ReactElement } from "react";
import Chip from "@mui/joy/Chip";
import type { ColorPaletteProp } from "@mui/joy/styles";
import type { RoleBadgeProps } from "@cfast/ui";

const VALID_COLORS = new Set<string>(["primary", "neutral", "danger", "success", "warning"]);

const defaultColors: Record<string, ColorPaletteProp> = {
  admin: "danger",
  editor: "primary",
  author: "success",
  reader: "neutral",
};

function isColorPaletteProp(value: string): value is ColorPaletteProp {
  return VALID_COLORS.has(value);
}

/**
 * Joy UI RoleBadge — MUI Joy Chip with configurable color per role.
 */
export function RoleBadge({ role, colors }: RoleBadgeProps): ReactElement {
  const rawColor = colors?.[role] ?? defaultColors[role] ?? "neutral";
  const chipColor: ColorPaletteProp = isColorPaletteProp(rawColor) ? rawColor : "neutral";

  return (
    <Chip size="sm" variant="soft" color={chipColor}>
      {role}
    </Chip>
  );
}
