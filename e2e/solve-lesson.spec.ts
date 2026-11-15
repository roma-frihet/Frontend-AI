import { expect, test, type Page, type Route } from "@playwright/test";

import { fakeAccessToken } from "./fixtures";

// 문제 풀기는 서버의 응시 상태(phase)를 따라간다.
// 여기서는 그 상태를 테스트가 직접 쥐고 화면이 제대로 따라오는지만 본다.

const QUESTION = {
  id: 102,
  type: "MULTIPLE_CHOICE",
  content: "광합성이 일어나는 곳은?",
  imageUrl: null,
  timeLimitSec: 30,
  options: [
    { id: 102, displayOrder: 0, content: "엽록체", imageUrl: null },
    { id: 103, displayOrder: 1, content: "미토콘드리아", imageUrl: null },
  ],
};

type AttemptState = Record<string, unknown>;

/** 응시 상태를 테스트가 바꿔 가며 돌려준다. 시작·제출은 요청만 받아 기록한다. */
const mockAttempt = async (page: Page, initial: AttemptState) => {
  const state = { current: initial };
  const calls: string[] = [];

  const json = (route: Route, body: unknown) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });

  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.includes("/attempt")) {
      if (/\/(start|submit|draft)$/.test(path)) {
        calls.push(`${route.request().method()} ${path.split("/attempt")[1]}`);
        return json(route, {});
      }
      return json(route, state.current);
    }

    return json(route, {});
  });

  // 세션을 심어 둬 로그인 화면을 거치지 않는다.
  await page.addInitScript((token) => {
    const session = {
      access_token: token,
      refresh_token: "test-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "test-user", aud: "authenticated", app_metadata: {} },
    };
    document.cookie = `sb-127-auth-token=base64-${btoa(JSON.stringify(session))}; path=/`;
  }, fakeAccessToken());

  return { state, calls };
};

test("시작하기 전에는 문제 본문이 보이지 않는다", async ({ page }) => {
  await mockAttempt(page, {
    phase: "READY",
    total: 2,
    nextIndex: 0,
    nextTimeLimitSec: 30,
  });

  await page.goto("/lessons/2/1");

  await expect(page.getByRole("heading", { name: "1번 문제" })).toBeVisible();
  await expect(page.getByText("제한 시간은 30초예요", { exact: false })).toBeVisible();

  // 미리 보고 준비하면 타이머가 의미가 없다. 본문도 보기도 없어야 한다.
  await expect(page.getByText(QUESTION.content)).toHaveCount(0);
  await expect(page.getByText("엽록체")).toHaveCount(0);
});

test("문제를 풀면 타이머와 보기가 나오고, 답을 골라야 제출할 수 있다", async ({ page }) => {
  const { state } = await mockAttempt(page, {
    phase: "IN_QUESTION",
    total: 2,
    nextIndex: 0,
    current: {
      questionIndex: 0,
      question: QUESTION,
      remainingMillis: 30_000,
      draftOptionId: null,
      draftText: null,
    },
  });
  void state;

  await page.goto("/lessons/2/1");

  await expect(page.getByText(QUESTION.content)).toBeVisible();
  await expect(page.getByText("남은 시간")).toBeVisible();

  const submit = page.getByRole("button", { name: "제출" });
  await expect(submit).toBeDisabled();

  await page.getByRole("button", { name: "엽록체" }).click();
  await expect(submit).toBeEnabled();
});

test("답을 고르면 임시 저장을 보낸다", async ({ page }) => {
  const { calls } = await mockAttempt(page, {
    phase: "IN_QUESTION",
    total: 2,
    nextIndex: 0,
    current: {
      questionIndex: 0,
      question: QUESTION,
      remainingMillis: 30_000,
      draftOptionId: null,
      draftText: null,
    },
  });

  await page.goto("/lessons/2/1");
  await page.getByRole("button", { name: "엽록체" }).click();

  // 제출을 못 누른 채 시간이 지나도 이 답이 인정되어야 한다.
  await expect.poll(() => calls.some((call) => call.includes("draft"))).toBe(true);
});

test("새로고침해도 임시 저장해 둔 답이 복원된다", async ({ page }) => {
  await mockAttempt(page, {
    phase: "IN_QUESTION",
    total: 2,
    nextIndex: 0,
    current: {
      questionIndex: 0,
      question: QUESTION,
      remainingMillis: 12_000,
      draftOptionId: 103,
      draftText: null,
    },
  });

  await page.goto("/lessons/2/1");

  await expect(page.getByRole("button", { name: "미토콘드리아" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "제출" })).toBeEnabled();
});

test("제출하면 정답과 해설이 바로 보인다", async ({ page }) => {
  await mockAttempt(page, {
    phase: "READY",
    total: 2,
    nextIndex: 1,
    nextTimeLimitSec: 20,
    last: {
      questionIndex: 0,
      result: "WRONG",
      byTimeout: false,
      selectedOptionId: 103,
      correctOptionId: 102,
      correctAnswer: "엽록체",
      explanation: "엽록체에서 일어납니다.",
    },
  });

  await page.goto("/lessons/2/1");

  await expect(page.getByText("아쉬워요")).toBeVisible();
  await expect(page.getByText("엽록체", { exact: true })).toBeVisible();
  await expect(page.getByText("엽록체에서 일어납니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "시작" })).toBeVisible();
});

test("시간이 지나 채점되면 그렇다고 알려 준다", async ({ page }) => {
  await mockAttempt(page, {
    phase: "DONE",
    total: 2,
    nextIndex: 2,
    correctCount: 1,
    last: {
      questionIndex: 1,
      result: "NONE",
      byTimeout: true,
      correctAnswer: "이산화탄소",
      explanation: "이산화탄소입니다.",
    },
  });

  await page.goto("/lessons/2/1");

  await expect(page.getByText("답을 내지 못했어요")).toBeVisible();
  await expect(page.getByText(/시간이 지나서 저장해 둔 답으로 채점했어요/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "이 차시를 다 풀었어요" })).toBeVisible();
  await expect(page.getByText("/ 2문제 맞혔어요")).toBeVisible();
});
