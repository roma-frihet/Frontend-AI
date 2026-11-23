// 삭제는 되돌릴 수 없고 서버는 기록이 있어도 지운다. 막아 주는 것은 확인 모달뿐이라,
// "취소하면 요청이 나가지 않는다"를 테스트로 고정해 둔다.

import { expect, test, type Page } from "@playwright/test";

import { mockApi, mockSupabaseAuth, teacherStubs } from "./fixtures";

const stubs = teacherStubs();

/** 나간 DELETE 요청의 경로를 모은다. */
const watchDeletes = (page: Page) => {
  const paths: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "DELETE") {
      paths.push(new URL(request.url()).pathname);
    }
  });
  return paths;
};

const signIn = async (page: Page) => {
  await page.goto("/teacher/login");
  await page.getByLabel("이메일").fill("teacher1@example.com");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL("/teacher");
};

test("수업 삭제는 무엇이 사라지는지 숫자로 보여 준다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, stubs);
  await signIn(page);

  await page.getByRole("button", { name: "3학년 과학 삭제" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "3학년 과학을 지울까요?" }),
  ).toBeVisible();
  // 반 1개(TEACHER_MYPAGE), 학생 1명(TEACHER_SUMMARIES), 차시 2개
  await expect(
    page.getByText("반 1개, 학생 1명, 차시 2개가 함께 사라집니다."),
  ).toBeVisible();
});

test("취소하면 삭제 요청이 나가지 않는다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, stubs);
  const deletes = watchDeletes(page);
  await signIn(page);

  await page.getByRole("button", { name: "3학년 과학 삭제" }).click();
  await page.getByRole("button", { name: "취소" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  expect(deletes).toHaveLength(0);
});

test("삭제를 누르면 그때 요청이 나간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, stubs);
  const deletes = watchDeletes(page);
  await signIn(page);

  await page.getByRole("button", { name: "3학년 과학 삭제" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();

  await expect
    .poll(() => deletes)
    .toEqual(expect.arrayContaining(["/api/v1/teacher/courses/2"]));
});

test("연 적 있는 차시에서도 문제를 지울 수 있다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, stubs);
  const deletes = watchDeletes(page);
  await signIn(page);

  await page.goto("/teacher/prepare");
  // 1차시는 FINISHED다. 전에는 이 버튼이 비활성화였다.
  await page.getByRole("button", { name: "1번 문제 삭제" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();

  await expect
    .poll(() => deletes)
    .toEqual(expect.arrayContaining(["/api/v1/teacher/questions/102"]));
});

test("차시 삭제는 딸린 문제 수를 알려 준다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, stubs);
  await signIn(page);

  await page.goto("/teacher/prepare");
  await page.getByRole("button", { name: "삭제", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "1차시 광합성을 지울까요?" }),
  ).toBeVisible();
  await expect(page.getByText("문제 1개가 함께 사라집니다.")).toBeVisible();
});

test("반 삭제는 학생 수를 알려 주고 학급 관리로 돌아간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, stubs);
  const deletes = watchDeletes(page);
  await signIn(page);

  await page.goto("/teacher/classrooms/2");
  await page.getByRole("button", { name: "3학년 5반 삭제" }).click();
  await expect(page.getByText("학생 1명이 함께 사라집니다.")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();

  await expect
    .poll(() => deletes)
    .toEqual(expect.arrayContaining(["/api/v1/teacher/classrooms/2"]));
  await expect(page).toHaveURL("/teacher");
});
