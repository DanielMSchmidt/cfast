import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, Outlet, redirect } from "react-router";
import Sheet from "@mui/joy/Sheet";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import { requireUser, hasRole } from "~/auth.helpers.server";
import { ImpersonationBanner } from "~/components/ImpersonationBanner";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  return { user };
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {user.isImpersonating && <ImpersonationBanner user={user} />}

      <Sheet
        variant="outlined"
        sx={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography level="h4">Admin</Typography>
        </Box>

        <List
          sx={{
            "--ListItem-radius": "8px",
            "--List-padding": "8px",
            "--List-gap": "4px",
          }}
        >
          <ListItem>
            <ListItemButton component={Link} to="/admin">
              Dashboard
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton component={Link} to="/admin/users">
              Users
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton component={Link} to="/admin/posts">
              Posts
            </ListItemButton>
          </ListItem>
        </List>
      </Sheet>

      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          overflow: "auto",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
