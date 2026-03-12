import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./helpers";
import { publishedPost, seedComments } from "./seed";
import { resetAndSeedDatabase } from "./setup";

test.beforeAll(() => {
  resetAndSeedDatabase();
});

test.describe.serial("Adding Comments", () => {
  const commentText = "This is a new comment from Playwright tests!";

  test("authenticated user posts a comment on a published post", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto(`/posts/${publishedPost.slug}`, { waitUntil: "networkidle" });

    const textarea = page.getByPlaceholder("Write a comment...");
    await textarea.waitFor({ state: "visible" });
    await textarea.fill(commentText);
    await page.getByRole("button", { name: "Post Comment" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(commentText)).toBeVisible();
  });

  test("comment form rejects empty content", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto(`/posts/${publishedPost.slug}`);

    // The textarea has required attribute, so submitting empty should not work.
    const textarea = page.getByPlaceholder("Write a comment...");
    await textarea.fill("");
    await page.getByRole("button", { name: "Post Comment" }).click();

    // The form should not submit successfully (HTML5 validation)
    // We stay on the same page
    await expect(page).toHaveURL(new RegExp(publishedPost.slug));
  });

  test("anonymous user cannot see comment form", async ({ page }) => {
    await page.goto(`/posts/${publishedPost.slug}`);
    await expect(page.getByPlaceholder("Write a comment...")).not.toBeVisible();
    await expect(page.getByText("Sign in")).toBeVisible();
  });
});

test.describe.serial("Deleting Comments", () => {
  test("comment author can delete their own comment", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto(`/posts/${publishedPost.slug}`);

    // The reader authored comment-001: "Great article! Very helpful for getting started."
    const commentSection = page.getByText("Great article! Very helpful for getting started.").locator("xpath=ancestor::*[contains(@class, 'MuiCard')]");
    const deleteButton = commentSection.getByRole("button", { name: "Delete" });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Great article! Very helpful for getting started.")).not.toBeVisible();
  });

  test("editor can delete any comment", async ({ page, context }) => {
    await loginAs(context, "editor");
    await page.goto(`/posts/${publishedPost.slug}`);

    // Find the remaining comment from the "Adding Comments" tests
    const commentText = "This is a new comment from Playwright tests!";
    await expect(page.getByText(commentText)).toBeVisible();
    const commentSection = page.getByText(commentText).locator("xpath=ancestor::*[contains(@class, 'MuiCard')]");
    const deleteButton = commentSection.getByRole("button", { name: "Delete" });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(commentText)).not.toBeVisible();
  });

  test("reader cannot see delete button on other users' comments", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto(`/posts/${publishedPost.slug}`);

    // The editor's comment (comment-002) should still exist:
    // "Nice writeup. Consider adding a section about environment variables."
    const editorComment = page.getByText("Nice writeup. Consider adding a section about environment variables.");
    await expect(editorComment).toBeVisible();

    // Find the card containing this comment
    const commentSection = editorComment.locator("xpath=ancestor::*[contains(@class, 'MuiCard')]");
    // There should be no Delete button for the reader on someone else's comment
    await expect(commentSection.getByRole("button", { name: "Delete" })).not.toBeVisible();
  });
});
