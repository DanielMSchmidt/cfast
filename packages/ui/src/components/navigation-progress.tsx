import { createElement } from "react";
import { useNavigation } from "react-router";
import type { NavigationProgressProps } from "../types.js";

/**
 * Thin progress bar at the top of the page during React Router navigation.
 * Shows when navigation state is "loading", hides when "idle".
 */
export function NavigationProgress({
  color = "#1976d2",
}: NavigationProgressProps) {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  if (!isNavigating) {
    return null;
  }

  return createElement("div", {
    role: "progressbar",
    "aria-label": "Loading",
    style: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      height: "3px",
      backgroundColor: color,
      zIndex: 9999,
      animation: "nav-progress 2s ease-in-out infinite",
    },
  });
}
