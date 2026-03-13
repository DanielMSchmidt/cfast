import type { AvatarWithInitialsProps } from "../types.js";

/**
 * Extracts up to two uppercase initials from a full name.
 *
 * Splits the name on spaces and takes the first character of each part.
 *
 * @param name - The full name to extract initials from.
 * @returns A string of 1-2 uppercase characters (e.g. `"DS"` for `"Daniel Schmidt"`).
 *
 * @example
 * ```ts
 * getInitials("Daniel Schmidt"); // "DS"
 * getInitials("Alice");          // "A"
 * ```
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
 * Avatar component with automatic initials fallback.
 *
 * Renders an `<img>` when a `src` URL is provided. When `src` is absent or null,
 * displays the user's initials (derived via {@link getInitials}) inside a circular
 * badge. This is the headless implementation; styled versions are provided by UI plugins.
 *
 * @param props - See {@link AvatarWithInitialsProps}.
 *
 * @example
 * ```tsx
 * <AvatarWithInitials
 *   src={user.avatarUrl}
 *   name={user.name}
 *   size="sm"
 * />
 * ```
 */
export function AvatarWithInitials({
  src,
  name,
  size = "md",
}: AvatarWithInitialsProps) {
  const px = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          objectFit: "cover" as const,
        }}
      />
    );
  }

  return (
    <span
      aria-label={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
        borderRadius: "50%",
        backgroundColor: "#ddd",
        fontSize: px * 0.4,
        fontWeight: "bold",
      }}
    >
      {getInitials(name)}
    </span>
  );
}
