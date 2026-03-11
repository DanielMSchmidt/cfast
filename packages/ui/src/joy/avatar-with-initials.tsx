import { createElement, type ReactElement } from "react";
import Avatar from "@mui/joy/Avatar";
import type { AvatarWithInitialsProps } from "../types.js";
import { getInitials } from "../components/avatar-with-initials.js";

/**
 * Joy UI AvatarWithInitials — MUI Joy Avatar with initials fallback.
 */
export function AvatarWithInitials({
  src,
  name,
  size = "md",
}: AvatarWithInitialsProps): ReactElement {
  return createElement(Avatar, {
    src: src ?? undefined,
    alt: name,
    size,
    children: getInitials(name),
  });
}
