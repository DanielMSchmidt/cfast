import { type ReactElement } from "react";
import Avatar from "@mui/joy/Avatar";
import type { AvatarWithInitialsProps } from "@cfast/ui";
import { getInitials } from "@cfast/ui";

/**
 * Joy UI AvatarWithInitials — MUI Joy Avatar with initials fallback.
 */
export function AvatarWithInitials({
  src,
  name,
  size = "md",
}: AvatarWithInitialsProps): ReactElement {
  return (
    <Avatar src={src ?? undefined} alt={name} size={size}>
      {getInitials(name)}
    </Avatar>
  );
}
