import { type ReactElement } from "react";
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

  return (
    <Sheet
      color="warning"
      variant="solid"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        py: 1,
        px: 3,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
        <Typography level="body-sm" sx={{ fontWeight: "bold" }}>
          {`Viewing as ${user.name} (${user.email})`}
        </Typography>
        <form method="post" action={stopAction}>
          <Button size="sm" variant="outlined" color="warning" type="submit">
            Stop Impersonating
          </Button>
        </form>
      </Stack>
    </Sheet>
  );
}
