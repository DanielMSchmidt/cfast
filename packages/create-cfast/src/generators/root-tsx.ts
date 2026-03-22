import type { Config } from "../types";

export function generateRootTsx(config: Config): string {
  const imports: string[] = [
    `import {`,
    `  isRouteErrorResponse,`,
    `  Links,`,
    `  Meta,`,
    `  Outlet,`,
    `  Scripts,`,
    `  ScrollRestoration,`,
    `} from "react-router";`,
  ];

  let beforeChildren = "";
  let afterChildren = "";
  let beforeOutlet = "";
  let afterOutlet = "";
  let pluginSetup = "";
  let errorContent: string;

  if (config.features.ui && config.uiLibrary === "joy") {
    imports.push(`import { CssVarsProvider } from "@mui/joy/styles";`);
    imports.push(`import CssBaseline from "@mui/joy/CssBaseline";`);
    imports.push(`import Typography from "@mui/joy/Typography";`);
    imports.push(`import Container from "@mui/joy/Container";`);
    imports.push(
      `import { createUIPlugin, UIPluginProvider, ConfirmProvider } from "@cfast/ui";`,
    );
    imports.push(`import { ConfirmDialog } from "@cfast/joy";`);

    pluginSetup = `\nconst plugin = createUIPlugin({\n  components: { confirmDialog: ConfirmDialog },\n});\n`;

    beforeChildren = `        <CssVarsProvider>\n          <CssBaseline />\n          <UIPluginProvider plugin={plugin}>\n            <ConfirmProvider>`;
    afterChildren = `            </ConfirmProvider>\n          </UIPluginProvider>\n        </CssVarsProvider>`;

    errorContent = `    <Container sx={{ pt: 8, p: 4 }}>
      <Typography level="h1">{message}</Typography>
      <Typography>{details}</Typography>
      {stack && (
        <pre style={{ width: "100%", padding: "16px", overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </Container>`;
  } else {
    errorContent = `    <div style={{ padding: "2rem" }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre style={{ width: "100%", padding: "16px", overflowX: "auto" }}>
          <code>{stack}</code>
        </pre>
      )}
    </div>`;
  }

  if (config.features.auth) {
    imports.push(`import { AuthClientProvider } from "@cfast/auth/client";`);
    imports.push(`import { authClient } from "~/auth.client";`);
    beforeOutlet = `    <AuthClientProvider authClient={authClient}>`;
    afterOutlet = `    </AuthClientProvider>`;
  }

  const childrenBlock = beforeChildren
    ? `${beforeChildren}\n              {children}\n${afterChildren}`
    : `        {children}`;

  const outletBlock = beforeOutlet
    ? `${beforeOutlet}\n      <Outlet />\n${afterOutlet}`
    : `    <Outlet />`;

  return `${imports.join("\n")}
${pluginSetup}
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
${childrenBlock}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
${outletBlock}
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
${errorContent}
  );
}
`;
}
