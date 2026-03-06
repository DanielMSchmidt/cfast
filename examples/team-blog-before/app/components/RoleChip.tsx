import Chip from "@mui/joy/Chip";
import type { ColorPaletteProp } from "@mui/joy/styles";

const roleColors: Record<string, ColorPaletteProp> = {
  admin: "danger",
  editor: "primary",
  author: "success",
  reader: "neutral",
};

export function RoleChip({ role }: { role: string }) {
  const color = roleColors[role] ?? "neutral";

  return (
    <Chip size="sm" variant="soft" color={color}>
      {role}
    </Chip>
  );
}
