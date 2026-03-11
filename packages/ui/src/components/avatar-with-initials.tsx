import { createElement } from "react";
import type { AvatarWithInitialsProps } from "../types.js";

/**
 * Extracts up to 2 initials from a name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const sizeMap = { sm: 32, md: 40, lg: 56 } as const;

/**
 * Headless AvatarWithInitials — renders an img or initials span.
 */
export function AvatarWithInitials({
  src,
  name,
  size = "md",
}: AvatarWithInitialsProps) {
  const px = sizeMap[size];

  if (src) {
    return createElement("img", {
      src,
      alt: name,
      style: {
        width: px,
        height: px,
        borderRadius: "50%",
        objectFit: "cover" as const,
      },
    });
  }

  return createElement(
    "span",
    {
      "aria-label": name,
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
        borderRadius: "50%",
        backgroundColor: "#ddd",
        fontSize: px * 0.4,
        fontWeight: "bold",
      },
    },
    getInitials(name),
  );
}
