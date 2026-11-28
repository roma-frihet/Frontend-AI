import { readFileSync } from "node:fs";

import { expect, test, type Page, type Request } from "@playwright/test";

import {
  QUESTION_STATS,
  STUDENT_ANSWERS,
  TEACHER_CLASSROOMS,
  TEACHER_LESSONS,
  mockApi,
  mockSupabaseAuth,
  signInAsTeacher,
  teacherStubs,
} from "./fixtures";

/** 나간 요청 중 고른 메서드만 모은다. */
const watch = (page: Page, method: string) => {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (request.method() === method && request.url().includes("/api/v1/")) {
      requests.push(request);
    }
  });
  return requests;
};

/** 1차시가 이 반에서 진행 중인 상태 */
const OPEN_LESSONS = [
  {
    ...TEACHER_LESSONS[0],
    classrooms: [{ classroomId: 2, classNo: 5, status: "OPEN" }],
  },
  TEACHER_LESSONS[1],
];
const OPEN_STATS = [{ ...QUESTION_STATS[0], status: "OPEN" }];

test("교사로 로그인하면 학급 관리로 간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);

  await expect(page.getByRole("heading", { name: "학급 관리", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3학년 과학" })).toBeVisible();
  const card = page.getByRole("link", { name: /5반/ });
  await expect(card).toContainText("학생 1명");
  await expect(card).toContainText("1차시까지 마감");
  await expect(card).toContainText("1.0 / 2");
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
    page.getByText("교사 계정이 아니에요. 학생이라면 학생 로그인을 이용해 주세요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/teacher\/login$/);
});

test("로그인하지 않으면 교사 화면에서 로그인으로 보낸다", async ({ page }) => {
  await mockApi(page, teacherStubs());

  await page.goto("/teacher/prepare");

  await expect(page).toHaveURL(/\/teacher\/login$/);
});

test("옛 문제 관리·학생 관리 주소는 새 화면으로 넘어간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await signInAsTeacher(page);

  await page.goto("/teacher/questions");
  await expect(page).toHaveURL("/teacher/prepare");
  await expect(page.getByRole("heading", { name: "차시·문제 준비", level: 1 })).toBeVisible();

  await page.goto("/teacher/students");
  await expect(page).toHaveURL("/teacher");
});

test("반 카드를 누르면 반 상세의 수업 진행으로 간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await signInAsTeacher(page);

  await page.getByRole("link", { name: /5반/ }).click();

  await expect(page).toHaveURL("/teacher/classrooms/2");
  await expect(page.getByRole("heading", { name: "3학년 5반 과학" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "수업 진행" })).toHaveAttribute("aria-selected", "true");
  // 2차시는 문제가 없어 열 수 없다. 문제를 넣으러 보낸다.
  await expect(page.getByRole("link", { name: "문제 넣으러 가기" })).toBeVisible();
});

test("열기 예약은 시간대를 붙여 보낸다", async ({ page }) => {
  const lessons = [
    TEACHER_LESSONS[0],
    {
      ...TEACHER_LESSONS[1],
      questionCount: 1,
      classrooms: [{ classroomId: 2, classNo: 5, status: "PLANNED" }],
    },
  ];
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/courses/2/lessons": lessons,
      "/api/v1/teacher/classrooms/2/lessons/2/schedule": {},
    }),
  );
  const puts = watch(page, "PUT");
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await page.getByRole("button", { name: "예약" }).click();
  await page.getByRole("group", { name: "여는 날" }).getByRole("combobox").click();
  await page.getByRole("option", { name: /^내일,/ }).click();
  await page.getByRole("combobox", { name: "시" }).click();
  await page.getByRole("option", { name: "오전 9시", exact: true }).click();
  await page.getByRole("combobox", { name: "분" }).click();
  await page.getByRole("option", { name: "10분", exact: true }).click();
  await page.getByRole("group", { name: "자동 마감" }).getByRole("button", { name: "열고 30분 뒤" }).click();
  await expect(page.getByRole("status").filter({ hasText: "내일" })).toContainText(
    "30분 뒤인 오전 9:40에 자동으로 마감해요",
  );
  await page.getByRole("button", { name: "예약하기" }).click();

  await expect.poll(() => puts.length).toBe(1);
  const body = puts[0].postDataJSON() as { openAt: string; finishAt: string };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  // 시간대가 없으면 서버(UTC)에서 9시간 어긋난다.
  expect(body.openAt).toMatch(new RegExp(`^${day}T09:10:00[+-]\\d{2}:\\d{2}$`));
  expect(body.finishAt).toMatch(new RegExp(`^${day}T09:40:00[+-]\\d{2}:\\d{2}$`));
});

test("주관식은 같은 답을 한 번에 정답으로 인정한다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/classrooms/2/lessons/1/questions/104/answer-overrides": {
        changedCount: 1,
      },
    }),
  );
  const posts = watch(page, "POST");
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2?lesson=1");

  await expect(page.getByRole("heading", { name: "1차시 광합성" })).toBeVisible();
  await page.getByRole("button", { name: /광합성에 필요한 기체는/ }).click();
  await page.getByRole("button", { name: "정답으로 인정 (1명)" }).click();

  await expect.poll(() => posts.length).toBe(1);
  // answerText는 분포에서 받은 원문을 그대로 돌려보낸다.
  expect(posts[0].postDataJSON()).toEqual({ answerText: "이산화 탄소 기체", result: "RIGHT" });
});

test("학생별 보기에서 개별 답을 정답으로 인정한다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({ "/api/v1/teacher/attempt-answers/900/result": {} }),
  );
  const puts = watch(page, "PUT");
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2?lesson=1");

  await page.getByRole("button", { name: "학생별" }).click();
  await expect(page).toHaveURL(/view=students/);
  // displayOrder(3)에 빈 번호가 있어도 학생이 본 번호(number = 2)로 보여 준다.
  const row = page.getByRole("row", { name: /광합성에 필요한 기체는/ });
  await expect(row.getByRole("cell").first()).toHaveText("2");
  await row.getByRole("button", { name: "정답 인정" }).click();

  await expect.poll(() => puts.length).toBe(1);
  expect(puts[0].url()).toContain("/attempt-answers/900/result");
  expect(puts[0].postDataJSON()).toEqual({ result: "RIGHT" });
});

test("수업 중 화면은 정답률과 이름을 숨긴 채 열리고, 닫으면 보던 차시로 돌아간다", async ({
  page,
}) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/courses/2/lessons": OPEN_LESSONS,
      "/api/v1/teacher/courses/2/lessons/1/question-stats": OPEN_STATS,
    }),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2?lesson=1&view=compare");

  await page.getByRole("link", { name: "수업 화면 띄우기" }).click();
  await expect(page).toHaveURL("/teacher/classrooms/2/live?lesson=1");

  await expect(page.getByRole("button", { name: "정답률 보기" })).toBeVisible();
  await expect(page.getByText(/학생 이름은 숨겨져 있어요/)).toBeVisible();
  await expect(page.getByRole("region", { name: "문제별 현황" })).not.toContainText("%");

  await page.getByRole("button", { name: "정답률 보기" }).click();
  await expect(page.getByRole("region", { name: "문제별 현황" })).toContainText("100%");

  await page.getByRole("button", { name: "차시로 돌아가기" }).click();
  // 차시 목록이나 반 첫 화면이 아니라 열기 전에 보던 차시 상세(반 비교)로 돌아온다.
  await expect(page).toHaveURL("/teacher/classrooms/2?lesson=1&view=compare");
  await expect(page.getByRole("heading", { name: /반별 비교/ })).toBeVisible();
});

test("학생 화면 미리보기는 닫아도 보던 차시 상세에 머문다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2?lesson=1");

  await page.getByRole("button", { name: "학생 화면 미리보기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("답은 저장되지 않아요");
  await expect(dialog).toContainText("광합성이 일어나는 곳은?");

  await dialog.getByRole("button", { name: "닫기" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL("/teacher/classrooms/2?lesson=1");
});

test("성적 탭의 학생별 보기는 그 차시의 학생별 보기로 간다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2?tab=scores");

  const row = page.getByRole("row", { name: /1차시 광합성/ });
  await expect(row).toContainText("1 / 1명");
  await row.getByRole("button", { name: "학생별 보기" }).click();

  await expect(page).toHaveURL("/teacher/classrooms/2?lesson=1&view=students");
  await expect(page.getByRole("button", { name: "학생별" })).toHaveAttribute("aria-pressed", "true");
});

test("성적 내보내기는 서버가 정한 파일 이름으로 내려받는다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await page.route("**/api/v1/teacher/courses/2/scores/export**", (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/csv;charset=UTF-8",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent("3학년 과학 5반 점수.csv")}`,
      },
      body: "﻿학번,이름\n30512,김하늘\n",
    }),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2?tab=scores");

  await page.getByRole("button", { name: "엑셀로 내보내기" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "내려받기" }).click();

  const file = await download;
  expect(file.suggestedFilename()).toBe("3학년 과학 5반 점수.csv");
  // 엑셀이 한글을 깨뜨리지 않도록 서버가 붙인 BOM이 그대로 남아야 한다.
  const bytes = readFileSync((await file.path())!);
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
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
    }),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await expect(page.getByText("KJW76K")).toBeVisible();
  await expect(page.getByText(/남음$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "코드 닫기" })).toBeVisible();
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
    }),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await expect(page.getByText("KJW76K")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "코드 발급" })).toBeVisible();
});

test("학생 탭에서 살펴볼 학생과 임시 비밀번호를 본다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await page.route("**/password-reset", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ temporaryPassword: "7ux427z2" }),
    }),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await page.getByRole("tab", { name: "학생" }).click();
  await expect(page).toHaveURL("/teacher/classrooms/2?tab=students");
  const row = page.getByRole("row", { name: /김하늘/ });
  await expect(row).toContainText("응답 안 함");

  await row.getByRole("button", { name: "비밀번호 초기화" }).click();
  await expect(page.getByText("7ux427z2")).toBeVisible();
  await expect(page.getByText(/다시 볼 수 없어요/)).toBeVisible();
});

test("학생 상세에서 차시 줄을 누르면 그 풀이로 내려 주고 표가 출렁이지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/classrooms/2/students/1/lessons/1/answers": STUDENT_ANSWERS,
      "/api/v1/teacher/classrooms/2/students/1/lessons/2/answers": {
        ...STUDENT_ANSWERS,
        lessonNumber: 2,
        lessonTitle: "호흡",
      },
      "/api/v1/teacher/classrooms/2/students/1": {
        membershipId: 1,
        classroomId: 2,
        classNo: 5,
        studentName: "김하늘",
        studentNumber: "30512",
        scores: [
          { lessonNumber: 1, correctCount: 1, questionCount: 2, classAverageCorrect: 1 },
          { lessonNumber: 2, correctCount: 0, questionCount: 1, classAverageCorrect: 0 },
        ],
        totalCorrectCount: 1,
        totalQuestionCount: 3,
        latestLessonNumber: 1,
        latestAnswers: [],
      },
    }),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2?tab=students&student=1");

  const row1 = page.getByRole("row", { name: /1차시/ });
  const row2 = page.getByRole("row", { name: /2차시/ });
  await expect(row1.getByRole("button", { name: /1차시/ })).toHaveAttribute("aria-current", "true");
  const before = (await row1.boundingBox())!.height;

  // 줄 아무 데나 눌러도(여기서는 점수 칸) 그 차시 풀이로 바뀌고 아래로 내려간다.
  await row2.getByRole("cell").nth(1).click();
  await expect(page).toHaveURL(/lesson=2/);
  await expect(page.getByRole("heading", { name: "문제별 풀이" })).toBeInViewport();
  await expect(row2.getByRole("button", { name: /2차시/ })).toHaveAttribute("aria-current", "true");

  // 고른 줄이 바뀌어도 줄 높이가 그대로여야 표가 출렁이지 않는다.
  // (소수점 반올림 차이 1px 미만은 눈에 보이지 않으므로 허용한다.)
  expect(Math.abs((await row1.boundingBox())!.height - before)).toBeLessThan(1);
  expect(Math.abs((await row2.boundingBox())!.height - before)).toBeLessThan(1);
});

test("반 상세에서 탭을 옮기거나 창으로 돌아오면 차시 상태를 새로 받는다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  let lessonCalls = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/v1/teacher/courses/2/lessons") lessonCalls += 1;
  });
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");
  await expect(page.getByText("광합성")).toBeVisible();
  const first = lessonCalls;

  // 탭을 옮기면 다시 받는다. (예약 마감처럼 그사이 바뀐 상태를 반영)
  await page.getByRole("tab", { name: "성적" }).click();
  await expect.poll(() => lessonCalls).toBeGreaterThan(first);

  // 다른 창에 갔다가 돌아와도 다시 받는다.
  const afterTab = lessonCalls;
  await page.waitForTimeout(2100);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => lessonCalls).toBeGreaterThan(afterTab);
});

test("연 적 있는 차시에는 문제를 더할 수 없다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);
  await page.getByRole("link", { name: "차시·문제 준비" }).click();

  // 1차시는 FINISHED다. 더하는 것만 막는다.
  await expect(page.getByText(/이미 연 차시라 새 문제를 넣을 수 없어요/)).toBeVisible();
  await expect(page.getByText(/이미 학생에게 연 차시예요/)).toBeVisible();

  // 지우기와 수정은 막지 않는다. 조건이 다르고 판단은 서버가 한다.
  await expect(page.getByRole("button", { name: "1번 문제 삭제" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "1번 문제 수정" })).toBeEnabled();
  // 열기·마감은 학급 관리에서 한다.
  await expect(page.getByRole("button", { name: /열기$/ })).toHaveCount(0);
});

test("고른 문제만 다른 차시로 복사한다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/courses/2/lessons/1/copy": {
        targetCourseId: 2,
        targetLessonNumber: 3,
        copiedCount: 1,
      },
    }),
  );
  const posts = watch(page, "POST");
  await signInAsTeacher(page);
  await page.goto("/teacher/prepare");

  await page.getByRole("button", { name: "복사" }).click();
  await page.getByLabel("1번 문제 복사에 포함").check();
  await page.getByRole("button", { name: "1문제 복사하기" }).click();

  await expect(page.getByText("3학년 과학 3차시에 1문제를 복사했어요.")).toBeVisible();
  expect(posts[0].postDataJSON()).toEqual({
    targetCourseId: 2,
    targetLessonNumber: null,
    questionIds: [102],
  });
});

test("복사할 수 없으면 서버가 알려 준 이유를 보여 준다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());
  await page.route("**/api/v1/teacher/courses/2/lessons/1/copy", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/problem+json",
      body: JSON.stringify({
        status: 400,
        title: "Bad Request",
        detail: "복사할 문제가 없습니다.",
        code: "LS023",
      }),
    }),
  );
  await signInAsTeacher(page);
  await page.goto("/teacher/prepare");

  await page.getByRole("button", { name: "복사" }).click();
  await page.getByRole("button", { name: "차시 전체 복사하기" }).click();

  await expect(page.getByText("복사할 문제가 없습니다.")).toBeVisible();
});

test("보기가 2개면 O/X로 채울 수 있다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);
  await page.goto("/teacher/prepare");
  await page.getByRole("button", { name: /2차시/ }).click();

  await page.getByRole("button", { name: "O / X로 채우기" }).click();

  await expect(page.getByLabel("보기 1")).toHaveValue("O");
  await expect(page.getByLabel("보기 2")).toHaveValue("X");
});

test("좁은 화면에서는 메뉴가 쌓이고 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSupabaseAuth(page, "teacher");
  await mockApi(page, teacherStubs());

  await signInAsTeacher(page);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const aside = await page.getByRole("complementary", { name: "교사 메뉴" }).boundingBox();
  expect(aside!.width).toBeGreaterThan(300);
});

test("열린 차시는 지금부터 몇 분 뒤에 마감할지만 고른다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/courses/2/lessons": OPEN_LESSONS,
      "/api/v1/teacher/classrooms/2/lessons/1/schedule": {},
    }),
  );
  const puts = watch(page, "PUT");
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await page.getByRole("button", { name: "자동 마감" }).click();
  await expect(page.getByRole("group", { name: "여는 날" })).toHaveCount(0);
  const before = Date.now();
  await page.getByRole("group", { name: "자동 마감" }).getByRole("button", { name: "지금부터 15분 뒤" }).click();
  await page.getByRole("button", { name: "예약하기" }).click();

  await expect.poll(() => puts.length).toBe(1);
  const body = puts[0].postDataJSON() as { openAt: string | null; finishAt: string };
  expect(body.openAt).toBeNull();
  const minutes = (new Date(body.finishAt).getTime() - before) / 60000;
  expect(minutes).toBeGreaterThan(13);
  expect(minutes).toBeLessThan(17);
});

test("자동 마감 시간은 직접 입력할 수도 있다", async ({ page }) => {
  await mockSupabaseAuth(page, "teacher");
  await mockApi(
    page,
    teacherStubs({
      "/api/v1/teacher/courses/2/lessons": OPEN_LESSONS,
      "/api/v1/teacher/classrooms/2/lessons/1/schedule": {},
    }),
  );
  const puts = watch(page, "PUT");
  await signInAsTeacher(page);
  await page.goto("/teacher/classrooms/2");

  await page.getByRole("button", { name: "자동 마감" }).click();
  await page.getByRole("group", { name: "자동 마감" }).getByRole("button", { name: "직접 입력" }).click();
  const submit = page.getByRole("button", { name: "예약하기" });
  await expect(submit).toBeDisabled();

  const before = Date.now();
  await page.getByLabel("마감까지 몇 분").fill("45");
  await expect(page.getByRole("status").filter({ hasText: "자동으로 마감해요" })).toBeVisible();
  await submit.click();

  await expect.poll(() => puts.length).toBe(1);
  const body = puts[0].postDataJSON() as { finishAt: string };
  const minutes = (new Date(body.finishAt).getTime() - before) / 60000;
  expect(minutes).toBeGreaterThan(43);
  expect(minutes).toBeLessThan(47);
});
