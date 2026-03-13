import { Link } from "react-router";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Avatar from "@mui/joy/Avatar";
import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuItem from "@mui/joy/MenuItem";
import MenuButton from "@mui/joy/MenuButton";
import IconButton from "@mui/joy/IconButton";
import Stack from "@mui/joy/Stack";
import type { AuthUser } from "~/permissions";
import { hasAnyRole } from "~/permissions";
import { authClient } from "~/auth.client";
import { ImpersonationBanner } from "./ImpersonationBanner";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Header({ user }: { user: AuthUser | null }) {
  return (
    <>
      {user?.isImpersonating && <ImpersonationBanner user={user} />}
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
          <Button
            component={Link}
            to="/"
            variant="plain"
            color="neutral"
            size="sm"
          >
            Home
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {user && hasAnyRole(user, ["admin", "editor", "author"]) && (
            <Button component={Link} to="/posts/new" size="sm">
              New Post
            </Button>
          )}

          {!user ? (
            <Button component={Link} to="/login" variant="outlined" size="sm">
              Login
            </Button>
          ) : (
            <Dropdown>
              <MenuButton
                slots={{ root: IconButton }}
                slotProps={{ root: { variant: "plain", size: "sm" } }}
              >
                <Avatar src={user.avatarUrl ?? undefined} size="sm">
                  {getInitials(user.name)}
                </Avatar>
              </MenuButton>
              <Menu placement="bottom-end" size="sm">
                <MenuItem component={Link} to="/profile">
                  Profile
                </MenuItem>
                {hasAnyRole(user, ["admin"]) && (
                  <MenuItem component={Link} to="/admin">
                    Admin
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    authClient.signOut().then(() => {
                      window.location.href = "/";
                    });
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Dropdown>
          )}
        </Stack>
      </Sheet>
    </>
  );
}
