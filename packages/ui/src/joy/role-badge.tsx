import { createElement, type ReactElement } from "react";
import Chip from "@mui/joy/Chip";
import type { ColorPaletteProp } from "@mui/joy/styles";
import type { RoleBadgeProps } from "../types.js";

const defaultColors: Record<string, ColorPaletteProp> = {
  admin: "danger",
  editor: "primary",
  author: "success",
  reader: "neutral",
};

/**
 * Joy UI RoleBadge — MUI Joy Chip with configurable color per role.
 */
export function RoleBadge({ role, colors }: RoleBadgeProps): ReactElement {
  const colorMap = colors
    ? { ...defaultColors, ...Object.fromEntries(
        Object.entries(colors).map(([k, v]) => [k, v as ColorPaletteProp]),
      )}
    : defaultColors;
  const chipColor = colorMap[role] ?? ("neutral" satisfies ColorPaletteProp);

  return createElement(Chip, {
    size: "sm",
    variant: "soft",
    color: chipColor,
    children: role,
  });
}
