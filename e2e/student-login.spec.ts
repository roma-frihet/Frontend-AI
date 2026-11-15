import { expect, test } from "@playwright/test";

import { MEMBERSHIPS, REPORT, SCHOOLS, mockApi, mockSupabaseAuth } from "./fixtures";

const pickOption = async (
  page: import("@playwright/test").Page,
  id: string,
  label: string,
) => {
  await page.locator(`#${id}`).click();
  await page.getByRole("option", { name: label, exact: true }).click();
};

test("학번으로 로그인하면 학교와 학번이 이메일로 바뀌어 나간다", async ({ page }) => {
  const authRequests = await mockSupabaseAuth(page);
  await mockApi(page, {
    "/api/v1/schools": SCHOOLS,
    "/api/v1/student-profiles/me": {
      profile: {
        schoolId: 1,
        schoolName: "다원중학교",
        grade: 3,
        classNumber: 5,
        seatNumber: 12,
        studentNumber: "30512",
        name: "김하늘",
        mustChangePassword: false,
      },
    },
    "/api/v1/classroom-memberships": MEMBERSHIPS,
    "/api/v1/classrooms/2/report": REPORT,
  });

  await page.goto("/login");

  await pickOption(page, "school", "다원중학교");
  await pickOption(page, "grade", "3학년");
  await pickOption(page, "class", "5반");
  await pickOption(page, "seat", "12번");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL("/");

  // 서버 StudentLoginEmailPolicy와 같은 규칙이어야 한다.
  // 1번 학교 3학년 5반 12번 → s1-30512@...
  const login = authRequests.find((request) => request.url.includes("token"));
  expect((login?.body as { email: string }).email).toBe(
    "s1-30512@students.roma-frihet.app",
  );
});

test("가입 정보가 없으면 가입 정보 화면으로 보낸다", async ({ page }) => {
  await mockSupabaseAuth(page);
  await mockApi(page, {
    "/api/v1/schools": SCHOOLS,
    // 계정만 있고 서버에 가입 정보가 없는 상태
    "/api/v1/student-profiles/me": { profile: null },
  });

  await page.goto("/login");

  await pickOption(page, "school", "다원중학교");
  await pickOption(page, "grade", "3학년");
  await pickOption(page, "class", "5반");
  await pickOption(page, "seat", "12번");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/signup\/profile$/);
});

test("임시 비밀번호로 들어오면 비밀번호 변경 화면으로 보낸다", async ({ page }) => {
  await mockSupabaseAuth(page);
  await mockApi(page, {
    "/api/v1/schools": SCHOOLS,
    "/api/v1/student-profiles/me": {
      profile: { schoolId: 1, grade: 3, classNumber: 5, seatNumber: 12, name: "김하늘", mustChangePassword: true },
    },
  });

  await page.goto("/login");

  await pickOption(page, "school", "다원중학교");
  await pickOption(page, "grade", "3학년");
  await pickOption(page, "class", "5반");
  await pickOption(page, "seat", "12번");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/password$/);
});

test("학번이나 비밀번호가 틀리면 안내가 뜬다", async ({ page }) => {
  await mockApi(page, { "/api/v1/schools": SCHOOLS });
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "invalid_grant" }),
    }),
  );

  await page.goto("/login");

  await pickOption(page, "school", "다원중학교");
  await pickOption(page, "grade", "3학년");
  await pickOption(page, "class", "5반");
  await pickOption(page, "seat", "12번");
  await page.getByLabel("비밀번호").fill("wrong-password");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.getByText("학번이나 비밀번호가 맞지 않아요.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("비밀번호가 6자 미만이면 가입할 수 없다", async ({ page }) => {
  await mockSupabaseAuth(page);
  await mockApi(page, { "/api/v1/schools": SCHOOLS });

  await page.goto("/signup");

  await page.getByRole("button", { name: "다원중학교" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await pickOption(page, "grade", "3학년");
  await pickOption(page, "class", "5반");
  await pickOption(page, "seat", "12번");
  await page.getByLabel("이름").fill("김하늘");
  await page.getByRole("button", { name: "다음" }).click();

  const submit = page.getByRole("button", { name: "가입하기" });

  // 서버와 Supabase가 모두 6자를 최소로 본다. 화면도 같아야 한다.
  await page.getByLabel("비밀번호", { exact: true }).fill("12345");
  await expect(submit).toBeDisabled();

  await page.getByLabel("비밀번호", { exact: true }).fill("123456");
  await expect(submit).toBeEnabled();
});
