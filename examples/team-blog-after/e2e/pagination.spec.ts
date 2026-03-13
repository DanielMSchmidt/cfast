import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { resetAndSeedDatabase, loadState } from "./setup";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..");

test.describe("Home Pagination", () => {
  test.beforeAll(() => {
    resetAndSeedDatabase();

    const { userIds } = loadState();
    const authorId = userIds.author;

    // Insert 12 additional published posts so that with existing published posts
    // (there are 2 seeded published posts), we have enough for pagination (limit=10).
    const now = Math.floor(Date.now() / 1000);
    const statements: string[] = [];

    for (let i = 1; i <= 12; i++) {
      const id = `post-pagination-${String(i).padStart(3, "0")}`;
      const title = `Pagination Test Post ${String(i).padStart(2, "0")}`;
      const slug = `pagination-test-post-${String(i).padStart(2, "0")}`;
      const content = `Content for pagination test post ${i}.`;
      const publishedAt = now - (12 - i) * 3600;
      const createdAt = publishedAt - 86400;

      statements.push(
        `INSERT INTO posts (id, title, slug, content, excerpt, cover_image_key, author_id, published, published_at, created_at, updated_at) VALUES ('${id}', '${title}', '${slug}', '${content}', NULL, NULL, '${authorId}', 1, ${publishedAt}, ${createdAt}, ${publishedAt});`
      );
    }

    const tmpFile = path.join(PROJECT_DIR, ".tmp-pagination.sql");
    fs.writeFileSync(tmpFile, statements.join("\n"));
    try {
      execSync(
        `npx wrangler d1 execute DB --local --file "${tmpFile}"`,
        { cwd: PROJECT_DIR, stdio: "pipe" }
      );
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  test("when there are >10 published posts, pagination controls appear", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Latest Posts")).toBeVisible();

    // Pagination should be visible since we have more than 10 published posts
    await expect(page.getByRole("link", { name: "Next" })).toBeVisible();
  });

  test("clicking 'Next' goes to page 2", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Next" }).click();
    await page.waitForURL(/page=2/);

    // Page 2 should show remaining posts
    await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
  });

  test("clicking 'Previous' goes back to page 1", async ({ page }) => {
    await page.goto("/?page=2");

    await page.getByRole("link", { name: "Previous" }).click();
    await page.waitForURL(/page=1|\/$/);

    // Should be back on page 1
    await expect(page.getByText("Latest Posts")).toBeVisible();
  });
});
