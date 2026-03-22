import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Typography from "@mui/joy/Typography";
import Container from "@mui/joy/Container";
import { createUIPlugin, UIPluginProvider, ConfirmProvider } from "@cfast/ui";
import { ConfirmDialog } from "@cfast/joy";
import { AuthClientProvider } from "@cfast/auth/client";
import { authClient } from "~/auth.client";

const plugin = createUIPlugin({
  components: { confirmDialog: ConfirmDialog },
});

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <CssVarsProvider>
          <CssBaseline />
          <UIPluginProvider plugin={plugin}>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </UIPluginProvider>
        </CssVarsProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthClientProvider authClient={authClient}>
      <Outlet />
    </AuthClientProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Container sx={{ pt: 8, p: 4 }}>
      <Typography level="h1">{message}</Typography>
      <Typography>{details}</Typography>
      {stack && (
        <pre style={{ width: "100%", padding: "16px", overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </Container>
  );
}
