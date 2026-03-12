import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Admin Panel", () => {
  test("redirects non-admin users", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("shows dashboard to admin", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("Total Posts")).toBeVisible();
  });

  test("shows user list", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin?view=_users");
    await expect(page.getByText("admin@example.com")).toBeVisible();
    await expect(page.getByText("editor@example.com")).toBeVisible();
    await expect(page.getByText("author@example.com")).toBeVisible();
    await expect(page.getByText("reader@example.com")).toBeVisible();
  });

  test("shows user detail with roles", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin?view=_users");
    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();
  });

  test("shows posts list with status filter", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin?view=posts");
    await expect(page.getByText("Getting Started with Cloudflare Workers")).toBeVisible();
    await expect(page.getByText("Advanced Drizzle ORM Patterns")).toBeVisible();
  });

  test("admin sidebar navigation works", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin", { waitUntil: "networkidle" });

    await page.getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL(/\/admin\?view=_users/);

    await page.getByRole("link", { name: "Posts" }).click();
    await expect(page).toHaveURL(/\/admin\?view=posts/);

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });
});
