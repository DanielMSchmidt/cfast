/**
 * Captures screenshots from the team-blog-after example app for use in the docs.
 *
 * Run with: pnpm --filter team-blog-after test:screenshots
 *
 * Screenshots are saved to docs/website/src/assets/tutorial/.
 */
import { test, expect } from "@playwright/test";
import path from "path";
import { loginAs } from "./helpers";

const SCREENSHOTS_DIR = path.resolve(
  import.meta.dirname,
  "../../../docs/website/src/assets/tutorial",
);

const screenshotOpts = {
  fullPage: false,
  animations: "disabled" as const,
};

test.describe("Tutorial Screenshots", () => {
  // Step 1: Home page (anonymous visitor)
  test("step-01 home page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByText("Latest Posts")).toBeVisible();
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-01-home.png"),
    });
  });

  // Step 3: Auth — login page
  test("step-03 login page", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-03-login.png"),
    });
  });

  // Step 4: Permissions — home page as author (shows "New Post" button)
  test("step-04 author view with permissions", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "New Post" }).first()).toBeVisible();
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-04-author-home.png"),
    });
  });

  // Step 4: Permissions — home page as reader (no "New Post" button)
  test("step-04 reader view with permissions", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/", { waitUntil: "networkidle" });
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-04-reader-home.png"),
    });
  });

  // Step 5: CRUD — post detail page with action buttons (as editor)
  test("step-05 post detail with actions", async ({ page, context }) => {
    await loginAs(context, "editor");
    await page.goto("/posts/getting-started-with-cloudflare-workers", {
      waitUntil: "networkidle",
    });
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-05-post-detail.png"),
    });
  });

  // Step 5: CRUD — new post form
  test("step-05 new post form", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/posts/new", { waitUntil: "networkidle" });
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-05-new-post.png"),
    });
  });

  // Step 6: Admin panel
  test("step-06 admin panel", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-06-admin.png"),
    });
  });

  // Step 8: Profile page (shows user info, email settings)
  test("step-08 profile page", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/profile", { waitUntil: "networkidle" });
    await page.screenshot({
      ...screenshotOpts,
      path: path.join(SCREENSHOTS_DIR, "step-08-profile.png"),
    });
  });
});
