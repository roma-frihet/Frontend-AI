// 교사 계정은 발급받아 쓰므로 처음 들어오면 학교·이름(교사 프로필)이 없다.
// 이 정보 없이는 반을 만들 수 없어서, 첫 진입 화면에서 먼저 받는다.

import { expect, test } from "@playwright/test";

import {
  SCHOOLS,
  TEACHER_MYPAGE,
  mockApi,
  mockSupabaseAuth,
  signInAsTeacher,
  teacherStubs,
} from "./fixtures";

test("프로필이 없는 교사는 학교와 이름을 넣고 나서 학급 관리로 간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({ "/api/v1/schools": SCHOOLS, "/api/v1/teacher/profile": {} }),
  );

  let saved = false;
  // 뒤에 건 route가 먼저 잡는다. 저장 전에는 프로필이 없다.
  await page.route("**/api/v1/teacher/mypage", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(saved ? TEACHER_MYPAGE : { profile: null, courses: [] }),
    }),
  );
  const put = page.waitForRequest(
    (request) => request.method() === "PUT" && request.url().endsWith("/api/v1/teacher/profile"),
  );

  await page.goto("/teacher/login");
  await page.getByLabel("이메일").fill("teacher1@example.com");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL("/teacher/welcome");
  const start = page.getByRole("button", { name: "시작하기" });
  await expect(start).toBeDisabled();

  await page.getByRole("button", { name: "다원중학교" }).click();
  await page.getByLabel("이름").fill("예시 선생님");
  saved = true;
  await start.click();

  expect((await put).postDataJSON()).toEqual({ schoolId: 1, name: "예시 선생님" });
  await expect(page).toHaveURL("/teacher");
});

test("사이드바에서 로그아웃하면 교사 로그인으로 간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await signInAsTeacher(page);

  // 개발 서버에서는 왼쪽 아래 Next 개발 표시가 버튼을 덮어 클릭이 막힌다. 키보드로 누른다.
  await page
    .getByRole("complementary", { name: "교사 메뉴" })
    .getByRole("button", { name: "로그아웃" })
    .press("Enter");

  await expect(page).toHaveURL("/teacher/login");
  // 세션이 끊겼으므로 교사 화면에 다시 들어가면 로그인으로 돌려보낸다.
  await page.goto("/teacher");
  await expect(page).toHaveURL("/teacher/login");
});

test("마이페이지에서도 로그아웃할 수 있다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await signInAsTeacher(page);
  await page.goto("/teacher/mypage");

  await page.getByRole("main").getByRole("button", { name: "로그아웃" }).click();

  await expect(page).toHaveURL("/teacher/login");
});
