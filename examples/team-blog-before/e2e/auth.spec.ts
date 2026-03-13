import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Authentication", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Magic Link" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Passkey" })).toBeVisible();
  });

  test("redirects authenticated users away from login", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("shows user menu when logged in", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/");
    // Should see avatar/menu button instead of login
    await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
  });

  test("shows admin link in menu for admin users", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/");
    // Click the avatar to open menu
    const avatarButton = page.locator("header").getByRole("button").last();
    await avatarButton.click();
    await expect(page.getByRole("menuitem", { name: "Admin" })).toBeVisible();
  });

  test("does not show admin link for non-admin users", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/");
    const avatarButton = page.locator("header").getByRole("button").last();
    await avatarButton.click();
    await expect(page.getByRole("menuitem", { name: "Admin" })).not.toBeVisible();
  });
});
