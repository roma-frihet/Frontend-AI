import { expect, test, type Page } from "@playwright/test";

import {
  TEACHER_CLASSROOMS,
  TEACHER_LESSONS,
  TEACHER_MYPAGE,
  TEACHER_QUESTIONS,
  mockApi,
  mockSupabaseAuth,
} from "./fixtures";

const DASHBOARD = {
  classroomCount: 1,
  openLessonCount: 0,
  averageCorrect: null,
  averageQuestionCount: null,
  setup: {
    hasClassroom: true,
    hasLesson: true,
    hasQuestion: true,
    hasOpenedLesson: false,
  },
  liveLessons: [],
  lessons: [],
  classrooms: [],
  droppedStudents: [],
  notRespondedStudents: [],
};

const teacherStubs = (extra: Record<string, unknown> = {}) => ({
  "/api/v1/teacher/mypage": TEACHER_MYPAGE,
  "/api/v1/teacher/courses/2/dashboard": DASHBOARD,
  "/api/v1/teacher/classrooms": TEACHER_CLASSROOMS,
  "/api/v1/teacher/courses/2/lessons/1/questions": TEACHER_QUESTIONS,
  "/api/v1/teacher/courses/2/lessons/2/questions": [],
  "/api/v1/teacher/courses/2/lessons": TEACHER_LESSONS,
  "/api/v1/teacher/subjects": [{ id: 251, schoolLevel: "MIDDLE", name: "과학" }],
  ...extra,
});

const signInAsTeacher = async (page: Page) => {
  await page.goto("/teacher/login");
  await page.getByLabel("이메일").fill("teacher1@example.com");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL("/teacher");
};

test("교사로 로그인하면 대시보드로 간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);

  await expect(page.getByText("안녕하세요, 예시 선생님")).toBeVisible();
  // 아직 한 번도 열지 않았으니 시작하기 안내가 남아 있어야 한다.
  await expect(page.getByRole("heading", { name: "시작하기" })).toBeVisible();
  await expect(page.getByText("3 / 4")).toBeVisible();
});

test("학생 계정으로는 교사 화면에 들어갈 수 없다", async ({ page }) => {
  // role 없이 로그인시킨다 = 학생 계정
  await mockSupabaseAuth(page);
  await mockApi(page, teacherStubs());

  await page.goto("/teacher/login");
  await page.getByLabel("이메일").fill("student@example.com");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(
    page.getByText("교사 계정이 아닙니다. 학생이라면 학생 로그인을 이용하세요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/teacher\/login$/);
});

test("로그인하지 않으면 교사 화면에서 로그인으로 보낸다", async ({ page }) => {
  await mockApi(page, teacherStubs());

  await page.goto("/teacher/questions");

  await expect(page).toHaveURL(/\/teacher\/login$/);
});

test("연 적 있는 차시는 문제를 더하거나 지울 수 없다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);
  await page.getByRole("button", { name: "문제 관리" }).click();

  // 1차시는 FINISHED다.
  await expect(page.getByText(/연 적 있는 차시라 더하거나 지울 수 없습니다/)).toBeVisible();
  await expect(
    page.getByText(/이미 연 적 있는 차시에는 문제를 더할 수 없습니다/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "1번 문제 삭제" })).toBeDisabled();

  // 수정은 막지 않는다. 막는 조건이 다르고, 판단은 서버가 한다.
  await expect(page.getByRole("button", { name: "1번 문제 수정" })).toBeEnabled();
});

test("문제가 없는 차시는 열 수 없다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);
  await page.getByRole("button", { name: "문제 관리" }).click();
  await page.getByRole("button", { name: /2차시/ }).click();

  await expect(page.getByRole("button", { name: "열기" })).toBeDisabled();
  await expect(page.getByText("문제가 없는 차시는 열 수 없습니다.")).toBeVisible();
});

test("보기가 2개면 O/X로 채울 수 있다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);
  await page.getByRole("button", { name: "문제 관리" }).click();
  await page.getByRole("button", { name: /2차시/ }).click();

  await page.getByRole("button", { name: "O / X로 채우기" }).click();

  await expect(page.getByLabel("보기 1")).toHaveValue("O");
  await expect(page.getByLabel("보기 2")).toHaveValue("X");
});

test("수업 코드는 남은 시간과 함께 보인다", async ({ page }) => {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/classrooms": [
        { ...TEACHER_CLASSROOMS[0], joinCode: "KJW76K", joinCodeExpiresAt: expiresAt },
      ],
      "/api/v1/teacher/classrooms/2/students": {
        classroomId: 2,
        classNo: 5,
        studentCount: 1,
        students: [
          {
            membershipId: 1,
            studentName: "김하늘",
            studentNumber: "30512",
            totalCorrectCount: 1,
            totalQuestionCount: 2,
            status: "NOT_RESPONDED",
          },
        ],
      },
    }),
  );

  await signInAsTeacher(page);
  await page.getByRole("button", { name: "학생 관리" }).click();

  await expect(page.getByText("KJW76K")).toBeVisible();
  await expect(page.getByText("남은 시간")).toBeVisible();
  await expect(page.getByRole("button", { name: "코드 끄기" })).toBeVisible();

  // 상태가 눈에 띄어야 교사가 살펴볼 학생을 고를 수 있다.
  await expect(page.getByText("김하늘")).toBeVisible();
  await expect(page.getByText("미응답")).toBeVisible();
});

test("만료된 코드는 다시 발급하라고 안내한다", async ({ page }) => {
  const expiredAt = new Date(Date.now() - 1000).toISOString();

  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/classrooms": [
        { ...TEACHER_CLASSROOMS[0], joinCode: "KJW76K", joinCodeExpiresAt: expiredAt },
      ],
      "/api/v1/teacher/classrooms/2/students": {
        classroomId: 2,
        classNo: 5,
        studentCount: 0,
        students: [],
      },
    }),
  );

  await signInAsTeacher(page);
  await page.getByRole("button", { name: "학생 관리" }).click();

  await expect(page.getByText("KJW76K")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "코드 발급" })).toBeVisible();
});

test("임시 비밀번호는 다시 볼 수 없다고 알려 준다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/classrooms/2/students/1": {
        membershipId: 1,
        classroomId: 2,
        classNo: 5,
        studentName: "김하늘",
        studentNumber: "30512",
        scores: [{ lessonNumber: 1, correctCount: 1, questionCount: 2 }],
        totalCorrectCount: 1,
        totalQuestionCount: 2,
        latestLessonNumber: 1,
        latestAnswers: [],
      },
      "/api/v1/teacher/classrooms/2/students": {
        classroomId: 2,
        classNo: 5,
        studentCount: 1,
        students: [
          {
            membershipId: 1,
            studentName: "김하늘",
            studentNumber: "30512",
            totalCorrectCount: 1,
            totalQuestionCount: 2,
            status: "NORMAL",
          },
        ],
      },
    }),
  );
  await page.route("**/password-reset", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ temporaryPassword: "7ux427z2" }),
    }),
  );

  await signInAsTeacher(page);
  await page.getByRole("button", { name: "학생 관리" }).click();
  await page.getByRole("button", { name: /김하늘/ }).click();
  await page.getByRole("button", { name: "비밀번호 초기화" }).click();

  await expect(page.getByText("7ux427z2")).toBeVisible();
  await expect(page.getByText(/다시 볼 수 없습니다/)).toBeVisible();
});

test("시작조차 하지 않은 문제는 교사도 고칠 수 없다고 알려 준다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/classrooms/2/students/1": {
        membershipId: 1,
        classroomId: 2,
        classNo: 5,
        studentName: "김하늘",
        studentNumber: "30512",
        scores: [],
        totalCorrectCount: 0,
        totalQuestionCount: 0,
        latestLessonNumber: 2,
        latestAnswers: [],
      },
      "/api/v1/teacher/classrooms/2/students": {
        classroomId: 2,
        classNo: 5,
        studentCount: 1,
        students: [
          {
            membershipId: 1,
            studentName: "김하늘",
            studentNumber: "30512",
            totalCorrectCount: 0,
            totalQuestionCount: 0,
            status: "NORMAL",
          },
        ],
      },
    }),
  );

  await signInAsTeacher(page);
  await page.getByRole("button", { name: "학생 관리" }).click();
  await page.getByRole("button", { name: /김하늘/ }).click();

  await expect(
    page.getByText(/학생이 시작조차 하지 않은 문제는 교사도 손댈 수 없습니다/),
  ).toBeVisible();
});
