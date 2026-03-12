import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";
import { publishedPost } from "./seed";
import { resetAndSeedDatabase, loadState } from "./setup";

test.beforeAll(() => {
  resetAndSeedDatabase();
});

test.describe.serial("Role Management", () => {
  test("admin can assign 'author' role to reader user via the user detail page", async ({
    page,
    context,
  }) => {
    const { userIds } = loadState();
    await loginAs(context, "admin");
    await page.goto(`/admin?view=_users&id=${userIds.reader}`, { waitUntil: "networkidle" });

    // Joy UI Select: click the select trigger to open the listbox, then pick "author"
    // Joy UI Select renders with role="combobox" on the trigger element
    await page.getByText("Select role...").click();
    await page.getByRole("option", { name: "author" }).click();

    // Click the "Add Role" button
    await page.getByRole("button", { name: "Add Role" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText('Role "author" added to user.')).toBeVisible();
  });

  test("assigned role appears as a chip on the user detail page", async ({ page, context }) => {
    const { userIds } = loadState();
    await loginAs(context, "admin");
    await page.goto(`/admin?view=_users&id=${userIds.reader}`);

    // The "author" chip should now be visible in the Roles section
    // Use a specific selector to avoid matching the Select dropdown option
    await expect(page.locator('.MuiChip-root', { hasText: "author" })).toBeVisible();
  });

  test("admin can revoke a role from a user", async ({ page, context }) => {
    const { userIds } = loadState();
    await loginAs(context, "admin");
    await page.goto(`/admin?view=_users&id=${userIds.reader}`);

    // The chip has an "x" button to remove the role.
    // Find the chip containing "author" and click its remove button.
    const authorChip = page.locator('.MuiChip-root', { hasText: "author" }).first();
    await authorChip.getByRole("button").click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText('Role "author" removed from user.')).toBeVisible();
  });
});

test.describe.serial("Admin Post Management", () => {
  test("admin can delete a post from the admin posts list", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin?view=posts");

    // Find the post row and click its Delete button to open the ConfirmDialog
    const postRow = page.locator("tr", { hasText: publishedPost.title });
    await postRow.getByRole("button", { name: "Delete" }).click();

    // The ConfirmDialog modal should appear
    await expect(page.getByText("Delete record")).toBeVisible();
    await expect(page.getByText("Are you sure you want to delete")).toBeVisible();

    // Click Delete in the confirm dialog (role="alertdialog")
    await page.locator('[role="alertdialog"]').getByRole("button", { name: "Delete" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Deleted Posts record.")).toBeVisible();
  });

  test("deleted post disappears from the table", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin?view=posts");

    await expect(page.getByText(publishedPost.title)).not.toBeVisible();
  });
});

test.describe.serial("User Search", () => {
  test("admin can search users by name", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin?view=_users");

    // Joy UI Input with placeholder "Search users..."
    await page.getByPlaceholder("Search users...").fill("Editor");
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("editor@example.com")).toBeVisible();
  });

  test("search results filter correctly", async ({ page, context }) => {
    await loginAs(context, "admin");
    await page.goto("/admin?view=_users&search=Editor");

    // Only the editor user should be visible
    await expect(page.getByText("editor@example.com")).toBeVisible();
    // Other users should not be listed
    await expect(page.getByText("admin@example.com")).not.toBeVisible();
    await expect(page.getByText("author@example.com")).not.toBeVisible();
    await expect(page.getByText("reader@example.com")).not.toBeVisible();
  });
});
