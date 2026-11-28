// 운영 DB에는 courseId -48 같은 음수 ID가 실제로 있다.
// 예전에는 `courseId > 0`으로 걸러서 차시 요청이 아예 나가지 않았고, 화면이 "불러오는 중"에 멈췄다.

import { expect, test } from "@playwright/test";

import {
  TEACHER_CLASSROOMS,
  TEACHER_LESSONS,
  TEACHER_MYPAGE,
  mockApi,
  mockSupabaseAuth,
  signInAsTeacher,
  teacherStubs,
} from "./fixtures";

const NEGATIVE = -48;

const negativeCourseStubs = () =>
  teacherStubs({
    "/api/v1/teacher/mypage": {
      ...TEACHER_MYPAGE,
      courses: TEACHER_MYPAGE.courses.map((course) => ({ ...course, id: NEGATIVE })),
    },
    "/api/v1/teacher/classrooms": TEACHER_CLASSROOMS.map((room) => ({
      ...room,
      courseId: NEGATIVE,
    })),
    [`/api/v1/teacher/courses/${NEGATIVE}/lessons/1/questions`]: [],
    [`/api/v1/teacher/courses/${NEGATIVE}/lessons`]: TEACHER_LESSONS,
  });

test("수업 ID가 음수여도 반 상세에서 차시를 불러온다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, negativeCourseStubs());
  const lessonRequest = page.waitForRequest((request) =>
    request.url().endsWith(`/api/v1/teacher/courses/${NEGATIVE}/lessons`),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await lessonRequest;
  await expect(page.getByText("광합성")).toBeVisible();
  await expect(page.getByText("불러오는 중…")).toHaveCount(0);
});

test("수업 ID가 음수여도 차시·문제 준비에서 차시를 불러온다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, negativeCourseStubs());
  await signInAsTeacher(page);
  await page.goto("/teacher/prepare");

  await expect(page.getByRole("button", { name: /광합성/ })).toBeVisible();
});

test("차시를 못 불러오면 계속 불러오는 중으로 두지 않고 오류와 다시 시도를 보여 준다", async ({
  page,
}) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  let fail = true;
  // 뒤에 건 route가 먼저 잡는다.
  await page.route("**/api/v1/teacher/courses/2/lessons", (route) =>
    fail
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            status: 500,
            title: "INTERNAL",
            detail: "차시를 불러오지 못했습니다.",
            code: "INTERNAL",
          }),
        })
      : route.fallback(),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await expect(page.getByRole("alert").filter({ hasText: "차시를 불러오지 못했습니다." })).toBeVisible();
  await expect(page.getByText("불러오는 중…")).toHaveCount(0);

  fail = false;
  await page.getByRole("button", { name: "다시 불러오기" }).click();
  await expect(page.getByText("광합성")).toBeVisible();
});
