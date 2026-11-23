import { expect, test, type Page } from "@playwright/test";

import {
  MEMBERSHIPS,
  REPORT,
  SCHOOLS,
  fakeAccessToken,
  mockApi,
  mockSupabaseAuth,
  teacherStubs,
} from "./fixtures";

// 학생은 수업 중 자기 폰으로 들어온다. 좁은 화면에서 가로로 밀리면 못 쓴다.
// 교사 화면도 248px 사이드바를 그대로 두면 본문이 140px만 남는다.

test.use({ viewport: { width: 390, height: 844 } });

/** 가로로 넘치는 만큼과, 넘치게 만든 요소를 함께 돌려준다. */
const overflow = (page: Page) =>
  page.evaluate(() => ({
    over: document.documentElement.scrollWidth - window.innerWidth,
    culprits: [...document.querySelectorAll("*")]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 3)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}[${(el.className || "").toString().slice(0, 45)}]`,
      ),
  }));

const expectNoOverflow = async (page: Page, name: string) => {
  const result = await overflow(page);
  expect(result.over, `${name} → ${JSON.stringify(result.culprits)}`).toBeLessThanOrEqual(
    0,
  );
};

const signInCookie = (page: Page) =>
  page.addInitScript((token) => {
    const session = {
      access_token: token,
      refresh_token: "test-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: "test-user",
        aud: "authenticated",
        email: "s1-30512@students.roma-frihet.app",
        app_metadata: {},
      },
    };
    document.cookie = `sb-127-auth-token=base64-${btoa(JSON.stringify(session))}; path=/`;
  }, fakeAccessToken());

// 긴 글이 들어가야 진짜로 밀리는지 알 수 있다.
const LONG = "아주 긴 문장이 들어왔을 때도 줄이 바뀌어야 합니다 ".repeat(4);

const STUDENT_STUBS = {
  "/api/v1/schools": SCHOOLS,
  "/api/v1/student-profiles/me": {
    profile: {
      schoolId: 1,
      grade: 3,
      classNumber: 5,
      seatNumber: 12,
      name: "김하늘",
      mustChangePassword: false,
    },
  },
  "/api/v1/classroom-memberships": MEMBERSHIPS,
  "/api/v1/classrooms/2/report": REPORT,
  "/api/v1/classrooms/2/report/wrong-questions": [],
  "/api/v1/classrooms/2/lessons": [
    { lessonNumber: 1, title: "광합성", status: "FINISHED" },
  ],
  "/api/v1/classrooms/2/lessons/1/attempt": {
    phase: "IN_QUESTION",
    total: 2,
    nextIndex: 0,
    current: {
      questionIndex: 0,
      remainingMillis: 30_000,
      draftOptionId: null,
      draftText: null,
      question: {
        id: 1,
        type: "MULTIPLE_CHOICE",
        content: LONG,
        timeLimitSec: 30,
        options: [
          { id: 1, displayOrder: 0, content: LONG },
          { id: 2, displayOrder: 1, content: "짧은 보기" },
        ],
      },
    },
  },
};

for (const [name, path] of [
  ["홈", "/"],
  ["가입 정보", "/signup/profile"],
  ["비밀번호 변경", "/password"],
  ["문제 풀기", "/lessons/2/1"],
] as const) {
  test(`학생 ${name}이 좁은 화면에서 넘치지 않는다`, async ({ page }) => {
    await mockSupabaseAuth(page);
    await mockApi(page, STUDENT_STUBS);
    await signInCookie(page);

    await page.goto(path);
    await page.waitForTimeout(1200);

    await expectNoOverflow(page, `학생 ${name}`);
  });
}

for (const [name, path] of [
  ["학급 관리", "/teacher"],
  ["반 수업 진행", "/teacher/classrooms/2"],
  ["차시 상세", "/teacher/classrooms/2?lesson=1"],
  ["반 비교", "/teacher/classrooms/2?lesson=1&view=compare"],
  ["학생", "/teacher/classrooms/2?tab=students"],
  ["성적", "/teacher/classrooms/2?tab=scores"],
  ["수업 중 화면", "/teacher/classrooms/2/live?lesson=1"],
  ["차시·문제 준비", "/teacher/prepare"],
  ["마이페이지", "/teacher/mypage"],
] as const) {
  test(`교사 ${name}가 좁은 화면에서 넘치지 않는다`, async ({ page }) => {
    await mockSupabaseAuth(page, "teacher");
    await mockApi(page, teacherStubs());

    await page.goto("/teacher/login");
    await page.getByLabel("이메일").fill("teacher1@example.com");
    await page.getByLabel("비밀번호").fill("test1234");
    await page.getByRole("button", { name: "로그인" }).click();
    await page.waitForURL("/teacher");

    await page.goto(path);
    await page.waitForTimeout(1200);

    await expectNoOverflow(page, `교사 ${name}`);
  });
}
