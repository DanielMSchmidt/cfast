import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Post Detail", () => {
  test("shows published post content", async ({ page }) => {
    await page.goto("/posts/getting-started-with-cloudflare-workers");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Getting Started with Cloudflare Workers"
    );
    await expect(page.getByText("Author User")).toBeVisible();
  });

  test("shows comments on published post", async ({ page }) => {
    await page.goto("/posts/getting-started-with-cloudflare-workers");
    await expect(page.getByText("Great article! Very helpful for getting started.")).toBeVisible();
  });

  test("returns 404 for draft posts to anonymous users", async ({ page }) => {
    const response = await page.goto("/posts/advanced-drizzle-orm-patterns");
    expect(response?.status()).toBe(404);
  });

  test("shows draft post to its author", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/posts/advanced-drizzle-orm-patterns");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Advanced Drizzle ORM Patterns"
    );
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  });

  test("shows edit button to post author", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/posts/getting-started-with-cloudflare-workers");
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
  });

  test("shows publish button to editors", async ({ page, context }) => {
    await loginAs(context, "editor");
    await page.goto("/posts/advanced-drizzle-orm-patterns");
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  });

  test("hides publish button from authors on own posts", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/posts/advanced-drizzle-orm-patterns");
    await expect(page.getByRole("button", { name: "Publish" })).not.toBeVisible();
  });

  test("shows comment form to authenticated users", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/posts/getting-started-with-cloudflare-workers");
    await expect(page.getByPlaceholder("Write a comment...")).toBeVisible();
  });

  test("hides comment form from anonymous users", async ({ page }) => {
    await page.goto("/posts/getting-started-with-cloudflare-workers");
    await expect(page.getByPlaceholder("Write a comment...")).not.toBeVisible();
    await expect(page.getByText("Sign in")).toBeVisible();
  });
});

test.describe("Create Post", () => {
  test("redirects anonymous users to login", async ({ page }) => {
    await page.goto("/posts/new");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects readers to home", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/posts/new");
    await expect(page).toHaveURL("/");
  });

  test("shows create form to authors", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/posts/new");
    await expect(page.getByRole("heading")).toContainText("New Post");
  });
});
