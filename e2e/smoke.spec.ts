import { expect, test } from "@playwright/test";

test("홈 페이지가 정상 렌더링된다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
