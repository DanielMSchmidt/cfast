import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";
import { publishedPost, draftPost, editorPost } from "./seed";
import { resetAndSeedDatabase } from "./setup";

test.beforeAll(() => {
  resetAndSeedDatabase();
});

test.describe.serial("Post Creation", () => {
  const newPostTitle = "My Test Post From Playwright";
  const newPostExcerpt = "A test excerpt for the new post.";
  const newPostContent = "This is the full content of the test post created by Playwright.";

  test("author creates a post via the form", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto("/posts/new");

    await page.fill('input[name="title"]', newPostTitle);
    await page.locator('textarea[name="excerpt"]').fill(newPostExcerpt);
    await page.locator('textarea[name="content"]').fill(newPostContent);
    await page.click('button[type="submit"]');

    // Should redirect to edit page
    await page.waitForURL(/\/posts\/my-test-post-from-playwright\/edit/);
    await expect(page.getByText("Edit Post")).toBeVisible();
  });

  test("the created post appears as a draft on the home page when logged in as author", async ({
    page,
    context,
  }) => {
    await loginAs(context, "author");
    await page.goto("/posts/my-test-post-from-playwright");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(newPostTitle);
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  });

  test("the created draft is NOT visible to anonymous users on home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(newPostTitle)).not.toBeVisible();

    // Also returns 404 when accessed directly
    const response = await page.goto("/posts/my-test-post-from-playwright");
    expect(response?.status()).toBe(404);
  });
});

test.describe.serial("Post Editing", () => {
  const updatedTitle = "Getting Started with Cloudflare Workers - Updated";

  test("author can edit own post title and content and save", async ({ page, context }) => {
    await loginAs(context, "author");
    await page.goto(`/posts/${publishedPost.slug}/edit`);

    await page.fill('input[name="title"]', updatedTitle);
    await page.locator('textarea[name="content"]').fill("Updated content for the post.");
    await page.click('button:has-text("Save Changes")');

    // Title change causes slug change, which triggers a redirect to the new edit URL
    await page.waitForURL(/\/posts\/getting-started-with-cloudflare-workers-updated\/edit/);
    await expect(page.getByText("Edit Post")).toBeVisible();
  });

  test("editor can access and edit another user's post", async ({ page, context }) => {
    await loginAs(context, "editor");
    await page.goto("/posts/getting-started-with-cloudflare-workers-updated/edit");

    await expect(page.getByText("Edit Post")).toBeVisible();
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeVisible();
    const currentTitle = await titleInput.inputValue();
    expect(currentTitle).toContain("Updated");
  });

  test("reader gets 403 trying to access edit page for a post they don't own", async ({
    page,
    context,
  }) => {
    await loginAs(context, "reader");
    const response = await page.goto("/posts/getting-started-with-cloudflare-workers-updated/edit");
    expect(response?.status()).toBe(403);
  });
});

test.describe.serial("Post Publishing", () => {
  test("editor publishes the author's draft", async ({ page, context }) => {
    await loginAs(context, "editor");
    await page.goto(`/posts/${draftPost.slug}`);

    // Verify draft chip is visible before publishing
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();

    await page.getByRole("button", { name: "Publish" }).click();

    // Wait for the page to revalidate and show the Unpublish button
    await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible({ timeout: 10000 });
  });

  test("the now-published post appears on the home page for anonymous users", async ({
    page,
    context,
  }) => {
    await logout(context);
    await page.goto("/");
    await expect(page.getByText(draftPost.title)).toBeVisible();
  });

  test("editor can unpublish the post", async ({ page, context }) => {
    await loginAs(context, "editor");
    await page.goto(`/posts/${draftPost.slug}`);

    await page.getByRole("button", { name: "Unpublish" }).click();

    // Draft chip should reappear
    await expect(page.getByText("Draft", { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test("author CANNOT publish own post (no publish button visible)", async ({
    page,
    context,
  }) => {
    await loginAs(context, "author");
    await page.goto(`/posts/${draftPost.slug}`);
    await expect(page.getByRole("button", { name: "Publish" })).not.toBeVisible();
  });
});

test.describe.serial("Post Deletion", () => {
  test("author can delete own post via the delete button with confirmation", async ({
    page,
    context,
  }) => {
    await loginAs(context, "author");
    await page.goto("/posts/my-test-post-from-playwright");

    // Handle the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    await page.getByRole("button", { name: "Delete" }).click();
    await page.waitForURL("/");
  });

  test("after deletion, redirected to home, post no longer visible", async ({
    page,
    context,
  }) => {
    await loginAs(context, "author");
    await page.goto("/");
    await expect(page.getByText("My Test Post From Playwright")).not.toBeVisible();
  });

  test("reader cannot see delete button on posts they don't own", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto(`/posts/${editorPost.slug}`);
    await expect(page.getByRole("button", { name: "Delete" })).not.toBeVisible();
  });

  test("admin can delete any post", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto(`/posts/${editorPost.slug}`);

    page.on("dialog", (dialog) => dialog.accept());

    // Use first() to target the post delete button (not comment delete buttons)
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.waitForURL("/");

    // Verify it's gone
    await expect(page.getByText(editorPost.title)).not.toBeVisible();
  });
});
