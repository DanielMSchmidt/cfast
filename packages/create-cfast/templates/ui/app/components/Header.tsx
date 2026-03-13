import { Link } from "react-router";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";

type HeaderProps = {
  user?: { name: string } | null;
};

export function Header({ user }: HeaderProps) {
  return (
    <Container sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography level="h4" component={Link} to="/" sx={{ textDecoration: "none" }}>
          {{projectName}}
        </Typography>
        <Stack direction="row" spacing={1}>
          {user ? (
            <Typography level="body-sm">{user.name}</Typography>
          ) : (
            <Button component={Link} to="/login" size="sm">
              Sign In
            </Button>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
