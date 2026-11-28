// 반 만들기는 학년·과목·반 번호만 고른다.
// 고른 학년·과목의 수업이 이미 있으면 거기에 붙이고, 없으면 수업부터 만든다.

import { expect, test, type Page, type Request } from "@playwright/test";

import { mockApi, mockSupabaseAuth, signInAsTeacher, teacherStubs } from "./fixtures";

const SUBJECTS = [
  { id: 251, schoolLevel: "MIDDLE", name: "과학" },
  { id: 252, schoolLevel: "MIDDLE", name: "국어" },
];

const posts = (page: Page) => {
  const list: Request[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/api/v1/teacher/")) {
      list.push(request);
    }
  });
  return list;
};

const pick = async (page: Page, label: string, option: string) => {
  await page.getByRole("dialog").getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
};

const openDialog = async (page: Page) => {
  await page.getByRole("button", { name: "반 만들기" }).first().click();
  await expect(page.getByRole("dialog", { name: "반 만들기" })).toBeVisible();
};

test("이미 있는 학년·과목을 고르면 그 수업에 반만 더한다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/subjects": SUBJECTS,
      "/api/v1/teacher/classrooms": { id: 3 },
    }),
  );
  const sent = posts(page);
  await signInAsTeacher(page);
  await openDialog(page);

  await expect(page.getByRole("dialog").getByText("수업", { exact: true })).toHaveCount(0);
  await pick(page, "학년", "3학년");
  await pick(page, "과목", "과학");
  // 3학년 과학에는 5반이 이미 있다.
  await page.getByRole("dialog").getByRole("combobox", { name: "반" }).click();
  await expect(page.getByRole("option", { name: "5반", exact: true })).toHaveCount(0);
  await page.getByRole("option", { name: "6반", exact: true }).click();
  await page.getByRole("button", { name: "만들기", exact: true }).click();

  await expect.poll(() => sent.length).toBe(1);
  expect(new URL(sent[0].url()).pathname).toBe("/api/v1/teacher/classrooms");
  expect(sent[0].postDataJSON()).toEqual({ courseId: 2, classNo: 6 });
});

test("처음 고르는 학년·과목이면 수업을 만든 뒤 반을 만든다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/subjects": SUBJECTS,
      "/api/v1/teacher/courses": { id: 7 },
      "/api/v1/teacher/classrooms": { id: 3 },
    }),
  );
  const sent = posts(page);
  await signInAsTeacher(page);
  await openDialog(page);

  await pick(page, "학년", "2학년");
  await pick(page, "과목", "국어");
  await pick(page, "반", "1반");
  await page.getByRole("button", { name: "만들기", exact: true }).click();

  await expect.poll(() => sent.length).toBe(2);
  expect(sent[0].postDataJSON()).toEqual({ schoolId: 1, grade: 2, subjectId: 252 });
  expect(sent[1].postDataJSON()).toEqual({ courseId: 7, classNo: 1 });
});

test("서버의 입력값 오류는 필드 이름 없이 안내한다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs({ "/api/v1/teacher/subjects": SUBJECTS }));
  await page.route("**/api/v1/teacher/courses", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            status: 400,
            title: "Bad Request",
            detail: "schoolId: 널이어서는 안됩니다",
            code: "INVALID_VALUE",
          }),
        })
      : route.fallback(),
  );
  await signInAsTeacher(page);
  await openDialog(page);

  await pick(page, "학년", "2학년");
  await pick(page, "과목", "국어");
  await pick(page, "반", "1반");
  await page.getByRole("button", { name: "만들기", exact: true }).click();

  await expect(page.getByRole("dialog").getByText("입력한 내용을 다시 확인해 주세요.")).toBeVisible();
  await expect(page.getByText(/schoolId/)).toHaveCount(0);
});
