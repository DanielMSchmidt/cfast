import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Home Page", () => {
  test("shows published posts to anonymous users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Latest Posts")).toBeVisible();
    await expect(page.getByText("Getting Started with Cloudflare Workers")).toBeVisible();
    await expect(page.getByText("Best Practices for React Router v7").first()).toBeVisible();
    // Draft should not be visible
    await expect(page.getByText("Advanced Drizzle ORM Patterns")).not.toBeVisible();
  });

  test("shows login button for anonymous users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });

  test("shows New Post button for authors", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "New Post" }).first()).toBeVisible();
  });

  test("does not show New Post button for readers", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "New Post" })).toHaveCount(0);
  });

  test("navigates to post detail when clicking a post", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const link = page.getByRole("link", { name: /Getting Started with Cloudflare Workers/ });
    await link.waitFor({ state: "visible" });
    // Wait for React hydration — document.readyState doesn't guarantee React is ready.
    // React attaches internal fiber properties to DOM elements during hydration.
    await page.waitForFunction(() => {
      const el = document.querySelector('a[href*="/posts/"]');
      return el != null && Object.keys(el).some(k => k.startsWith("__react"));
    }, { timeout: 15000 });
    await link.click();
    await page.waitForURL(/\/posts\/getting-started-with-cloudflare-workers/, { timeout: 15000 });
  });
});
