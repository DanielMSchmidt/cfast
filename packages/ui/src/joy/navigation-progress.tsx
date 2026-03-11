import { createElement, type ReactElement } from "react";
import LinearProgress from "@mui/joy/LinearProgress";
import { useNavigation } from "react-router";

/**
 * Joy UI NavigationProgress — LinearProgress with absolute positioning.
 */
export function NavigationProgress(): ReactElement | null {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  if (!isNavigating) {
    return null;
  }

  return createElement(LinearProgress, {
    sx: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      "--LinearProgress-radius": "0px",
      "--LinearProgress-thickness": "3px",
    },
  });
}
