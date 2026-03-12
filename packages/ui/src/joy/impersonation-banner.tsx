import { createElement, type ReactElement } from "react";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import { useCurrentUser } from "@cfast/auth/client";
import type { ImpersonationBannerProps } from "../types.js";

/**
 * Joy UI ImpersonationBanner — sticky warning sheet when impersonating.
 */
export function ImpersonationBanner({
  stopAction = "/admin/stop-impersonation",
}: ImpersonationBannerProps): ReactElement | null {
  const user = useCurrentUser();

  if (!user?.isImpersonating) {
    return null;
  }

  return createElement(
    Sheet,
    {
      color: "warning",
      variant: "solid",
      sx: {
        position: "sticky",
        top: 0,
        zIndex: 1100,
        py: 1,
        px: 3,
      },
    },
    createElement(
      Stack,
      { direction: "row", spacing: 2, alignItems: "center", justifyContent: "center" },
      createElement(Typography, {
        level: "body-sm",
        sx: { fontWeight: "bold" },
        children: `Viewing as ${user.name} (${user.email})`,
      }),
      createElement(
        "form",
        { method: "post", action: stopAction },
        createElement(Button, {
          size: "sm",
          variant: "outlined",
          color: "warning",
          type: "submit",
          children: "Stop Impersonating",
        }),
      ),
    ),
  );
}
