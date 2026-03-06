import { Form } from "react-router";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import type { AuthUser } from "~/permissions";

export function ImpersonationBanner({ user }: { user: AuthUser }) {
  if (!user.isImpersonating) return null;

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
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="center"
      >
        <Typography level="body-sm" sx={{ fontWeight: "bold" }}>
          Viewing as {user.name} ({user.email})
        </Typography>
        <Form method="post" action="/admin/stop-impersonation">
          <Button size="sm" variant="outlined" color="warning" type="submit">
            Stop Impersonating
          </Button>
        </Form>
      </Stack>
    </Sheet>
  );
}
