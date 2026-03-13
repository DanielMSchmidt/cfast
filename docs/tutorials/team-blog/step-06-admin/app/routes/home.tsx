import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import Container from "@mui/joy/Container";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import { getUser } from "~/auth.helpers.server";
import { Header } from "~/components/Header";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return { user };
}

export default function Home() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <Header user={user} />
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography level="h1" sx={{ mb: 2 }}>
          Team Blog
        </Typography>
        <Typography level="body-lg" sx={{ mb: 4, color: "neutral.600" }}>
          A collaborative blog built with CFast.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button component={Link} to="/posts" size="lg">
            Browse Posts
          </Button>
        </Stack>
      </Container>
    </>
  );
}
