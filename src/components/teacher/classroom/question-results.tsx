"use client";

// 차시 상세 > 문제별 — 문제마다 정답률, 누르면 응답 분포.
//
// 주관식은 같은 답(공백, 대소문자 무시)끼리 묶여 온다. 맞는 답인데 인정 답안에 없던 표현은
// 여기서 한 번에 정답으로 인정한다. answerText는 서버가 준 값을 그대로 돌려보낸다.
// rightCount == count면 이미 모두 인정된 답이다.

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { LOW_RATE, percent } from "@/components/teacher/lesson-status";
import { Chip, Panel } from "@/components/teacher/panel";
import { ErrorText, useRun } from "@/components/teacher/use-run";
import { overrideResultsByAnswer } from "@/api/generated";
import type {
  QuestionStatsResponseClassroom,
  QuestionStatsResponseQuestion,
} from "@/api/generated/model";
import { cn } from "cn";

const normalize = (text: string) => text.replace(/\s+/g, "").toLowerCase();

export function QuestionResults({
  classroomId,
  lessonNumber,
  stats,
}: {
  classroomId: number;
  lessonNumber: number;
  stats: QuestionStatsResponseClassroom;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const { run, busy, error } = useRun();
  // 화면 번호는 순서대로 센다. displayOrder는 중간 문제를 지우면 빈 번호가 생긴다.
  const questions = [...(stats.questions ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const responders = stats.responseCount ?? 0;

  return (
    <Panel>
      <div className="grid gap-0.5">
        <h3 className="text-lg font-bold">문제별 정답률 · 전체 {questions.length}문제</h3>
        <span className="text-sm text-muted-foreground">
          응답한 {responders}명 기준 · 문제를 누르면 응답 분포가 열립니다
        </span>
      </div>
      <ErrorText error={error} />

      <ul className="m-0 grid list-none gap-2 p-0">
        {questions.map((question, index) => {
          const id = question.questionId ?? 0;
          const right = question.rightCount ?? 0;
          const rate = percent(right, responders);
          const low = rate != null && rate < LOW_RATE * 100;
          const open = openId === id;

          return (
            <li
              key={id}
              className={cn(
                "rounded-md border",
                low ? "border-warning" : "border-border",
              )}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : id)}
                className="grid w-full gap-2 px-4 py-3 text-left"
              >
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <strong className="min-w-6 text-muted-foreground tabular-nums">
                    {index + 1}
                  </strong>
                  <Chip tone="bg-secondary text-muted-foreground">
                    {question.type === "SHORT_ANSWER" ? "주관식" : "객관식"}
                  </Chip>
                  <span className="min-w-0 flex-1 basis-56">{question.content ?? "그림 문제"}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    정답 {right} / {responders}명
                  </span>
                  <strong className="min-w-12 text-right text-lg tabular-nums">
                    {rate == null ? "–" : `${rate}%`}
                  </strong>
                  <ChevronDown
                    className={cn("size-4 transition-transform", open && "rotate-180")}
                    aria-hidden
                  />
                </span>
                <span aria-hidden className="h-2 overflow-hidden rounded-full bg-secondary">
                  <span
                    className={cn("block h-full rounded-full", low ? "bg-warning" : "bg-primary")}
                    style={{ width: `${rate ?? 0}%` }}
                  />
                </span>
              </button>

              {open ? (
                <Distribution
                  question={question}
                  responders={responders}
                  busy={busy}
                  onOverride={(answerText, result) =>
                    void run(() =>
                      overrideResultsByAnswer(classroomId, lessonNumber, id, {
                        answerText,
                        result,
                      }),
                    )
                  }
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function Distribution({
  question,
  responders,
  busy,
  onOverride,
}: {
  question: QuestionStatsResponseQuestion;
  responders: number;
  busy: boolean;
  onOverride: (answerText: string, result: "RIGHT" | "WRONG") => void;
}) {
  const accepted = new Set((question.acceptedAnswers ?? []).map(normalize));
  const isShort = question.type === "SHORT_ANSWER";
  const noAnswer = question.noAnswerCount ?? 0;

  const rows = isShort
    ? (question.answerTexts ?? []).map((item) => {
        const count = item.count ?? 0;
        const allRight = (item.rightCount ?? 0) === count;
        const isAccepted = accepted.has(normalize(item.answerText ?? ""));
        return {
          key: item.answerText ?? "",
          label: item.answerText ?? "",
          count,
          right: allRight,
          // 인정 답안에 원래 있던 답은 서버가 채점한 것이라 취소 대상이 아니다.
          action: !allRight ? "accept" : isAccepted ? null : "cancel",
        } as const;
      })
    : (question.options ?? []).map((option, index) => ({
        key: String(option.optionId),
        label: `${index + 1}. ${option.content ?? "그림 보기"}`,
        count: option.count ?? 0,
        right: Boolean(option.isCorrect),
        action: null,
      }));

  return (
    <div className="grid gap-2 border-t border-border bg-secondary px-4 py-3">
      {isShort ? (
        <span className="text-sm">
          인정 답안 <strong>{question.acceptedAnswers?.join(", ") || "–"}</strong>
        </span>
      ) : null}
      {rows.length === 0 && noAnswer === 0 ? (
        <p className="text-sm text-muted-foreground">아직 답한 학생이 없어요.</p>
      ) : null}
      {rows.map((row) => (
        <DistributionRow
          key={row.key}
          label={row.label}
          count={row.count}
          total={responders}
          right={row.right}
        >
          {row.action === "accept" ? (
            <AppButton
              variant="outline"
              className="h-8 bg-card px-2.5 text-sm"
              disabled={busy}
              onClick={() => onOverride(row.key, "RIGHT")}
            >
              정답으로 인정 ({row.count}명)
            </AppButton>
          ) : row.action === "cancel" ? (
            <AppButton
              variant="outline"
              className="h-8 bg-card px-2.5 text-sm"
              disabled={busy}
              onClick={() => onOverride(row.key, "WRONG")}
            >
              인정 취소
            </AppButton>
          ) : null}
        </DistributionRow>
      ))}
      {noAnswer > 0 ? (
        <DistributionRow label="응답 안 함" count={noAnswer} total={responders} right={false} />
      ) : null}
      {isShort ? (
        <p className="text-sm text-muted-foreground">
          표현이 달라도 맞는 답이면 정답으로 인정해 주세요. 같은 답을 쓴 학생 모두에게 바로
          반영돼요.
        </p>
      ) : null}
    </div>
  );
}

function DistributionRow({
  label,
  count,
  total,
  right,
  children,
}: {
  label: string;
  count: number;
  total: number;
  right: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className={cn("min-w-0 flex-1 basis-40", right && "font-bold text-success")}>
        {right ? "✓ " : ""}
        {label}
      </span>
      <span aria-hidden className="h-2 w-32 overflow-hidden rounded-full bg-card">
        <span
          className={cn("block h-full rounded-full", right ? "bg-success" : "bg-muted-foreground")}
          style={{ width: `${percent(count, total) ?? 0}%` }}
        />
      </span>
      <span className="min-w-10 text-right text-sm tabular-nums">{count}명</span>
      {children}
    </div>
  );
}
