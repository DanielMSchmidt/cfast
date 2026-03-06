import { type BrowserContext } from "@playwright/test";
import { loadState } from "./setup";

type Role = "admin" | "editor" | "author" | "reader";

export async function loginAs(context: BrowserContext, role: Role) {
  const { sessionCookies } = loadState();
  const cookieValue = sessionCookies[role];
  if (!cookieValue) {
    throw new Error(`No session cookie for role "${role}". Did createTestSessions() run?`);
  }

  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: cookieValue,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

export async function logout(context: BrowserContext) {
  await context.clearCookies();
}
