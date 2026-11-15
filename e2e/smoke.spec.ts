import { expect, test } from "@playwright/test";

import { SCHOOLS, mockApi } from "./fixtures";

// `/`는 로그인해야 볼 수 있어서 스모크 대상이 아니다. 로그인 화면이 뜨는지로 확인한다.
test("로그인 화면이 정상 렌더링된다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await mockApi(page, { "/api/v1/schools": SCHOOLS });

  const response = await page.goto("/login");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1, name: "로그인" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("로그인하지 않으면 홈에서 로그인 화면으로 보낸다", async ({ page }) => {
  await mockApi(page, { "/api/v1/schools": SCHOOLS });

  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
});
