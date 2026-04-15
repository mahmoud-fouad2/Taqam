import { expect, test } from "@playwright/test";

test.describe("public marketing experience", () => {
  test("english FAQ page renders clear public help actions", async ({ page }) => {
    await page.goto("/en/faq");

    await expect(page).toHaveTitle(/Taqam/i);
    await expect(page.getByRole("heading", { name: /Frequently Asked Questions/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Help Center/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Schedule a walkthrough/i }).first()).toBeVisible();
  });

  test("request walkthrough form shows required-field validation", async ({ page }) => {
    await page.goto("/en/request-demo");

    await expect(page.getByRole("heading", { name: /Schedule a walkthrough/i })).toBeVisible();
    await page.getByRole("button", { name: /Submit request/i }).click();

    await expect(page.getByText("Company name is required")).toBeVisible();
    await expect(page.getByText("Contact name is required")).toBeVisible();
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Select employee count")).toBeVisible();
  });

  test("login page keeps a clear public walkthrough route", async ({ page }) => {
    await page.goto("/en/login");

    await expect(page.getByRole("link", { name: /Schedule a walkthrough/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View pricing/i })).toBeVisible();
  });
});
