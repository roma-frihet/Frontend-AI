import { expect, test, type Page } from "@playwright/test";

import { MEMBERSHIPS, REPORT, SCHOOLS, mockApi, mockSupabaseAuth } from "./fixtures";

// 로그인 화면을 거쳐 세션을 만든 뒤 홈으로 간다. 세션은 브라우저 쿠키에 남는다.
const signIn = async (page: Page) => {
  await page.goto("/login");
  await page.locator("#school").click();
  await page.getByRole("option", { name: "다원중학교", exact: true }).click();
  for (const [id, label] of [
    ["grade", "3학년"],
    ["class", "5반"],
    ["seat", "12번"],
  ]) {
    await page.locator(`#${id}`).click();
    await page.getByRole("option", { name: label, exact: true }).click();
  }
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();
};

const PROFILE = {
  profile: {
    schoolId: 1,
    grade: 3,
    classNumber: 5,
    seatNumber: 12,
    name: "김하늘",
    mustChangePassword: false,
  },
};

test("아직 반이 없으면 수업 참여가 먼저 나온다", async ({ page }) => {
  await mockSupabaseAuth(page);
  await mockApi(page, {
    "/api/v1/schools": SCHOOLS,
    "/api/v1/student-profiles/me": PROFILE,
    "/api/v1/classroom-memberships": [],
  });

  await signIn(page);

  await expect(page.getByRole("heading", { name: "수업 참여하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "참여하기", exact: true })).toBeDisabled();
});

test("코드는 6자리를 다 채워야 참여할 수 있다", async ({ page }) => {
  await mockSupabaseAuth(page);
  await mockApi(page, {
    "/api/v1/schools": SCHOOLS,
    "/api/v1/student-profiles/me": PROFILE,
    "/api/v1/classroom-memberships": [],
  });

  await signIn(page);

  const connect = page.getByRole("button", { name: "참여하기", exact: true });
  await page.getByLabel("수업 코드").fill("KJW76");
  await expect(connect).toBeDisabled();

  await page.getByLabel("수업 코드").fill("KJW76K");
  await expect(connect).toBeEnabled();
});

test("반이 있으면 리포트와 탭이 보인다", async ({ page }) => {
  await mockSupabaseAuth(page);
  await mockApi(page, {
    "/api/v1/schools": SCHOOLS,
    "/api/v1/student-profiles/me": PROFILE,
    "/api/v1/classroom-memberships": MEMBERSHIPS,
    "/api/v1/classrooms/2/report/wrong-questions": [
      {
        lessonNumber: 1,
        lessonTitle: "광합성",
        questionIndex: 1,
        questionId: 103,
        content: "광합성에 필요한 기체는?",
        result: "WRONG",
        correctAnswer: "이산화탄소",
        explanation: "이산화탄소입니다.",
      },
    ],
    "/api/v1/classrooms/2/report": REPORT,
    "/api/v1/classrooms/2/lessons": [
      { lessonNumber: 1, title: "광합성", status: "FINISHED" },
    ],
  });

  await signIn(page);

  await expect(
    page.getByRole("heading", { name: "3학년 과학 5반", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "문제 풀기" })).toBeVisible();

  // 미응시는 0점이 아니다. 서버가 null로 구분해 주므로 화면에서도 구분한다.
  await page.getByRole("tab", { name: "차시별 기록" }).click();
  await expect(page.getByRole("cell", { name: "1 / 2" })).toBeVisible();

  await page.getByRole("tab", { name: "지난 차시" }).click();
  await expect(page.getByRole("button", { name: /1차시/ })).toBeVisible();

  await page.getByRole("tab", { name: "틀린 문제" }).click();
  await expect(page.getByText("광합성에 필요한 기체는?")).toBeVisible();
  await expect(page.getByText("이산화탄소입니다.")).toBeVisible();
});

test("마감된 차시가 없으면 지난 차시 탭이 비어 있다고 알려 준다", async ({ page }) => {
  await mockSupabaseAuth(page);
  await mockApi(page, {
    "/api/v1/schools": SCHOOLS,
    "/api/v1/student-profiles/me": PROFILE,
    "/api/v1/classroom-memberships": MEMBERSHIPS,
    "/api/v1/classrooms/2/report": REPORT,
    // 아직 열려만 있고 마감되지 않았다
    "/api/v1/classrooms/2/lessons": [
      { lessonNumber: 1, title: "광합성", status: "OPEN" },
    ],
  });

  await signIn(page);
  await page.getByRole("tab", { name: "지난 차시" }).click();

  await expect(
    page.getByText(/수업이 끝나면 정답과 해설을 여기에서 볼 수 있어요/),
  ).toBeVisible();
});
