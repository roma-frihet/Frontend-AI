"use client";

// 문제 풀기. 한 문제씩, 되돌아갈 수 없다.
//
//   시작 → (답 고르기, 수시로 임시 저장) → 제출 → 바로 정답·해설 → 다음 문제 시작
//
// 규칙이 빡빡한 곳이라 서버가 기준이다.
// - 시작하기 전에는 문제 본문이 내려오지 않는다. 미리 보고 준비하면 타이머가 의미가 없다.
// - 남은 시간은 current.remainingMillis로 온다. 기기 시계를 믿지 않는다.
// - 같은 문제를 다시 시작해도 시간이 늘어나지 않으므로 새로고침해도 안전하다.
// - 시간을 넘기면 임시 저장해 둔 답으로 채점된다. 그래서 답을 고를 때마다 저장을 보낸다.
// - 화면 복원은 GET .../attempt 하나로 된다. phase가 지금 어디인지 알려 준다.

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-field";
import { Brand } from "@/components/brand";
import { AnswerResult } from "@/components/student/answer-result";
import { QuestionTimer } from "@/components/student/question-timer";
import { Card } from "@/components/ui/card";
import {
  saveAttemptDraft,
  startAttemptQuestion,
  submitAttemptAnswer,
  useFindMyAttempt,
} from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";
import { cn } from "cn";

const DRAFT_DEBOUNCE_MS = 400;

export function SolveLesson({
  params,
}: {
  params: Promise<{ classroomId: string; lessonNumber: string }>;
}) {
  const { classroomId, lessonNumber } = use(params);
  const router = useRouter();

  const roomId = Number(classroomId);
  const lesson = Number(lessonNumber);

  const attempt = useFindMyAttempt(roomId, lesson);
  const state = attempt.data?.data;

  const [optionId, setOptionId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = state?.current;
  const question = current?.question;
  const questionIndex = current?.questionIndex;

  // 문제가 바뀌면 서버에 저장돼 있던 임시 답으로 화면을 맞춘다(새로고침 복원).
  const restoredFor = useRef<number | null>(null);
  useEffect(() => {
    if (questionIndex == null || restoredFor.current === questionIndex) return;

    restoredFor.current = questionIndex;
    setOptionId(current?.draftOptionId ?? null);
    setText(current?.draftText ?? "");
  }, [questionIndex, current?.draftOptionId, current?.draftText]);

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      await attempt.refetch();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "제출하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  // 답을 고를 때마다 임시 저장을 보낸다. 제출을 못 누른 채 시간이 지나도 이 답이 인정된다.
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraft = useCallback(
    (answer: { optionId?: number | null; text?: string | null }) => {
      if (questionIndex == null) return;

      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        // 임시 저장은 실패해도 흐름을 막지 않는다. 제출이 본 경기다.
        void saveAttemptDraft(roomId, lesson, questionIndex, answer).catch(() => {});
      }, DRAFT_DEBOUNCE_MS);
    },
    [roomId, lesson, questionIndex],
  );

  // 시간이 다 되면 서버가 임시 저장된 답으로 확정해 준다. 다시 읽어 결과를 받는다.
  const onExpire = useCallback(() => {
    void attempt.refetch();
  }, [attempt]);

  if (attempt.isPending) {
    return <Shell>{<p className="text-muted-foreground">불러오는 중…</p>}</Shell>;
  }

  if (attempt.isError || !state) {
    return (
      <Shell>
        <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
          <p>지금은 풀 수 없어요. 선생님이 문제를 열면 다시 들어와 주세요.</p>
          <AppButton onClick={() => router.replace("/")}>홈으로</AppButton>
        </Card>
      </Shell>
    );
  }

  const answered =
    question?.type === "MULTIPLE_CHOICE" ? optionId != null : text.trim().length > 0;

  return (
    <Shell>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-extrabold">{lesson}차시</h1>
        <p className="text-sm font-bold text-muted-foreground tabular-nums">
          {Math.min((state.nextIndex ?? 0) + 1, state.total ?? 0)} / {state.total}문제
        </p>
      </div>

      {/* 제출 직후 결과. 다음 문제를 시작하기 전까지 보여 준다. */}
      {state.phase !== "IN_QUESTION" && state.last ? (
        <AnswerResult last={state.last} />
      ) : null}

      {state.phase === "READY" ? (
        <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
          <div className="grid gap-1">
            <h2 className="text-lg font-bold">
              {(state.nextIndex ?? 0) + 1}번 문제
            </h2>
            <p className="text-muted-foreground">
              {state.nextTimeLimitSec
                ? `준비되면 시작을 눌러 주세요. 제한 시간은 ${state.nextTimeLimitSec}초예요.`
                : "준비되면 시작을 눌러 주세요."}
            </p>
          </div>
          <AppButton
            block
            disabled={busy}
            onClick={() =>
              run(() => startAttemptQuestion(roomId, lesson, state.nextIndex ?? 0))
            }
          >
            {busy ? "여는 중…" : "시작"}
          </AppButton>
        </Card>
      ) : null}

      {state.phase === "IN_QUESTION" && question && current ? (
        <Card className="grid gap-5 rounded-lg border border-border p-6 shadow-card ring-0">
          <QuestionTimer
            key={current.questionIndex}
            remainingMillis={current.remainingMillis ?? 0}
            totalSec={question.timeLimitSec ?? 0}
            onExpire={onExpire}
          />

          <p className="text-lg font-bold whitespace-pre-wrap">{question.content}</p>

          {question.imageUrl ? (
            // 서명된 임시 주소라 오래 들고 있지 않는다. 화면을 열 때 받은 것을 그대로 쓴다.
            <Image
              src={question.imageUrl}
              alt=""
              width={800}
              height={450}
              unoptimized
              className="h-auto w-full rounded-md border border-border"
            />
          ) : null}

          {question.type === "MULTIPLE_CHOICE" ? (
            <ul className="m-0 grid list-none gap-2 p-0">
              {question.options?.map((option, index) => (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={optionId === option.id}
                    onClick={() => {
                      setOptionId(option.id ?? null);
                      saveDraft({ optionId: option.id });
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors",
                      optionId === option.id
                        ? "border-primary bg-primary-soft font-bold text-primary-deep"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <span className="inline-grid size-6 shrink-0 place-items-center rounded-full border border-current text-sm tabular-nums">
                      {index + 1}
                    </span>
                    {option.content}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <AppInput
              aria-label="답"
              placeholder="답을 입력하세요"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                saveDraft({ text: event.target.value });
              }}
            />
          )}

          <AppButton
            block
            disabled={!answered || busy}
            onClick={() =>
              run(() =>
                submitAttemptAnswer(roomId, lesson, current.questionIndex ?? 0, {
                  optionId: question.type === "MULTIPLE_CHOICE" ? optionId : null,
                  text: question.type === "SHORT_ANSWER" ? text.trim() : null,
                }),
              )
            }
          >
            {busy ? "내는 중…" : "제출"}
          </AppButton>
        </Card>
      ) : null}

      {state.phase === "DONE" ? (
        <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
          <h2 className="text-lg font-bold">이 차시를 다 풀었어요</h2>
          <p className="flex items-baseline gap-1.5">
            <b className="text-3xl font-extrabold tabular-nums text-primary-deep">
              {state.correctCount ?? 0}
            </b>
            <span className="text-muted-foreground">/ {state.total}문제 맞혔어요</span>
          </p>
          <AppButton block onClick={() => router.replace("/")}>
            홈으로
          </AppButton>
        </Card>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-(--container-page) items-center justify-between gap-4 px-4 py-4">
          <Brand badge="학생" href="/" />
          <AppButton variant="outline" onClick={() => router.replace("/")}>
            <ArrowLeft className="size-4" aria-hidden />
            나가기
          </AppButton>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-3xl gap-gap px-4 py-6">{children}</main>
    </div>
  );
}
