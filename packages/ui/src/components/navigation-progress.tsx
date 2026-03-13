import { useNavigation } from "react-router";
import type { NavigationProgressProps } from "../types.js";

/**
 * Thin progress bar fixed to the top of the viewport during React Router navigation.
 *
 * Uses `useNavigation().state` from React Router to detect loading transitions.
 * Visible when `state === "loading"`, hidden when `state === "idle"`. No
 * configuration is required beyond dropping it into your root layout.
 *
 * @param props - See {@link NavigationProgressProps}.
 *
 * @example
 * ```tsx
 * // In your root layout:
 * <NavigationProgress />
 *
 * // With custom color:
 * <NavigationProgress color="#e91e63" />
 * ```
 */
export function NavigationProgress({
  color = "#1976d2",
}: NavigationProgressProps) {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      style={{
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        backgroundColor: color,
        zIndex: 9999,
        animation: "nav-progress 2s ease-in-out infinite",
      }}
    />
  );
}
