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
    // Capture browser errors for debugging
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`PAGE_ERROR: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`CONSOLE_ERROR: ${msg.text()}`);
    });

    await page.goto("/", { waitUntil: "networkidle" });
    const link = page.getByRole("link", { name: /Getting Started with Cloudflare Workers/ });
    await link.waitFor({ state: "visible" });
    // Wait for React hydration — React attaches internal fiber properties to DOM elements.
    await page.waitForFunction(() => {
      const el = document.querySelector('a[href*="/posts/"]');
      return el != null && Object.keys(el).some(k => k.startsWith("__react"));
    }, { timeout: 15000 });

    // Log the link's href and tag before clicking
    const href = await link.evaluate((el) => (el as HTMLAnchorElement).href);
    const tag = await link.evaluate((el) => el.tagName);
    console.log(`DEBUG: tag=${tag} href=${href}`);

    await link.click();

    try {
      await page.waitForURL(/\/posts\/getting-started-with-cloudflare-workers/, { timeout: 15000 });
    } catch (e) {
      const currentUrl = page.url();
      console.log(`DEBUG: currentUrl=${currentUrl}`);
      console.log(`DEBUG: errors=${JSON.stringify(errors)}`);
      // Also dump the page HTML title area for context
      const title = await page.title();
      console.log(`DEBUG: title=${title}`);
      throw e;
    }
  });
});
