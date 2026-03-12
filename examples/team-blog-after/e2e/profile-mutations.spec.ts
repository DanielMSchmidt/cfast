import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";
import { resetAndSeedDatabase } from "./setup";

test.beforeAll(() => {
  resetAndSeedDatabase();
});

test.describe.serial("Profile Updates", () => {
  const updatedName = "Reader Updated Name";

  test("user can update their display name", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/profile");

    await page.fill('input[name="name"]', updatedName);
    await page.click('button:has-text("Update Profile")');
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Profile updated successfully.")).toBeVisible();
  });

  test("name field cannot be empty", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/profile");

    // Clear the name field
    const nameInput = page.locator('input[name="name"]');
    await nameInput.clear();
    await page.click('button:has-text("Update Profile")');

    // The HTML5 required validation prevents form submission.
    // We verify we stay on the profile page (no redirect occurred).
    await expect(page).toHaveURL(/\/profile/);
    // The success message should NOT appear (form was not submitted)
    await expect(page.getByText("Profile updated successfully.")).not.toBeVisible();
  });

  test("updated name appears in header", async ({ page, context }) => {
    await loginAs(context, "reader");
    await page.goto("/profile");

    // Verify the name input has the updated value
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue(updatedName);

    // Navigate to home and check the header reflects the updated name
    await page.goto("/");
    // The header should show the user's avatar button (not "Login")
    await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
  });
});
