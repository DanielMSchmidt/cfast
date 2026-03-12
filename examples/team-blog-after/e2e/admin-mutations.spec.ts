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

    // MUI Joy Select uses a hidden input for form submission.
    // Directly set the value and submit to avoid hydration timing issues.
    const assignForm = page.locator('form:has(input[value="assignRole"])');
    await assignForm.waitFor({ state: "visible" });
    await assignForm.evaluate((form: HTMLFormElement) => {
      // MUI Joy Select renders a hidden <input> with the name attribute
      let input = form.querySelector('input[name="role"]') as HTMLInputElement;
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = "role";
        form.appendChild(input);
      }
      input.value = "author";
      form.requestSubmit();
    });
    await page.waitForLoadState("networkidle");

    await expect(page.getByText('Role "author" assigned successfully')).toBeVisible();
  });

  test("assigned role appears as a chip on the user detail page", async ({ page, context }) => {
    const { userIds } = loadState();
    await loginAs(context, "admin");
    await page.goto(`/admin?view=_users&id=${userIds.reader}`);

    // The "author" chip should now be visible in the Current Roles section
    const rolesSection = page.getByText("Current Roles").locator("..");
    await expect(rolesSection.getByText("author")).toBeVisible();
  });

  test("admin can revoke a role from a user", async ({ page, context }) => {
    const { userIds } = loadState();
    await loginAs(context, "admin");
    await page.goto(`/admin?view=_users&id=${userIds.reader}`);

    // The revoke form has hidden inputs with _action=revokeRole and roleId.
    // Submit the form directly since the "x" button inside MUI Chip's endDecorator
    // is obscured by the Chip overlay.
    const revokeForm = page.locator('form:has(input[value="revokeRole"])').first();
    await revokeForm.evaluate((form: HTMLFormElement) => form.requestSubmit());
    await page.waitForLoadState("networkidle");

    await expect(page.getByText('Role "author" revoked successfully')).toBeVisible();
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
    await expect(page.getByText("Delete Post")).toBeVisible();
    await expect(page.getByText("Are you sure you want to delete")).toBeVisible();

    // Click Confirm in the dialog
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Post deleted successfully")).toBeVisible();
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

    await page.fill('input[name="search"]', "Editor");
    await page.click('button:has-text("Search")');
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
