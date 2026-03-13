import { Link } from "react-router";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import type { AuthUser } from "~/permissions";
import { hasAnyRole } from "~/permissions";

export function Header({ user }: { user: AuthUser | null }) {
  return (
    <Sheet
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography
          component={Link}
          to="/"
          level="h4"
          sx={{ textDecoration: "none", color: "inherit" }}
        >
          Team Blog
        </Typography>
        <Button component={Link} to="/posts" variant="plain" color="neutral" size="sm">
          Posts
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        {user && hasAnyRole(user, ["admin", "editor"]) && (
          <Button component={Link} to="/posts/new" size="sm">
            New Post
          </Button>
        )}
        {!user ? (
          <Button component={Link} to="/login" variant="outlined" size="sm">
            Login
          </Button>
        ) : (
          <Typography level="body-sm">{user.name}</Typography>
        )}
      </Stack>
    </Sheet>
  );
}
