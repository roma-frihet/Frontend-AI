"use client";

// 학생 한 명의 기록과, 교사가 손댈 수 있는 것들.
//
// 결과 덮어쓰기 — 접속이 끊기는 등 사정이 있을 때 학생 이야기를 듣고 결과를 바꾼다.
// 확정된 문제만 바꿀 수 있고, 시작조차 하지 않은 문제는 목록에 없다.
//
// 비밀번호 초기화 — 임시 비밀번호가 응답에 한 번만 내려온다. 다시 볼 수 없으므로
// 교사가 받아 적을 수 있게 크게 보여 준다.

import { useState } from "react";
import { ChevronLeft, KeyRound, UserMinus } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppSelect } from "@/components/app-select";
import { Card } from "@/components/ui/card";
import {
  overrideAttemptResult,
  removeClassroomStudent,
  resetStudentPassword,
  useFindClassroomStudentDetail,
} from "@/api/generated";
import { cn } from "cn";

const RESULT_ITEMS = [
  { value: "RIGHT", label: "정답" },
  { value: "WRONG", label: "오답" },
  { value: "NONE", label: "미응답" },
];

export function StudentDetail({
  classroomId,
  membershipId,
  busy,
  onRun,
  onBack,
}: {
  classroomId: number;
  membershipId: number;
  busy: boolean;
  onRun: (task: () => Promise<unknown>) => void;
  onBack: () => void;
}) {
  const detail = useFindClassroomStudentDetail(classroomId, membershipId);
  const data = detail.data?.data;

  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  return (
    <div className="grid gap-gap">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AppButton variant="outline" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          학생 목록
        </AppButton>

        <span className="flex flex-wrap gap-2">
          <AppButton
            variant="outline"
            disabled={busy}
            onClick={() =>
              onRun(async () => {
                const { data: reset } = await resetStudentPassword(
                  classroomId,
                  membershipId,
                );
                setTemporaryPassword(reset.temporaryPassword ?? null);
              })
            }
          >
            <KeyRound className="size-4" aria-hidden />
            비밀번호 초기화
          </AppButton>
          <AppButton
            variant="outline"
            className="text-destructive hover:bg-destructive-soft"
            disabled={busy}
            onClick={() =>
              onRun(async () => {
                await removeClassroomStudent(classroomId, membershipId);
                onBack();
              })
            }
          >
            <UserMinus className="size-4" aria-hidden />
            내보내기
          </AppButton>
        </span>
      </div>

      {temporaryPassword ? (
        <Card className="grid gap-2 rounded-lg border border-warning bg-warning-soft p-6 shadow-card ring-0">
          <h3 className="font-bold">임시 비밀번호</h3>
          <p className="text-3xl font-extrabold tracking-wide tabular-nums">
            {temporaryPassword}
          </p>
          <p className="text-sm text-muted-foreground">
            이 화면을 벗어나면 다시 볼 수 없습니다. 학생에게 알려 주세요.
            학생은 다음 로그인에서 새 비밀번호를 정합니다.
          </p>
        </Card>
      ) : null}

      {detail.isPending ? (
        <p className="text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">
                {data?.studentName}
                <span className="ml-2 text-sm font-medium text-muted-foreground tabular-nums">
                  {data?.studentNumber}
                </span>
              </h2>
              <p className="flex items-baseline gap-1.5">
                <b className="text-2xl font-extrabold tabular-nums text-primary-deep">
                  {data?.totalCorrectCount ?? 0}
                </b>
                <span className="text-muted-foreground">
                  / {data?.totalQuestionCount ?? 0}문제
                </span>
              </p>
            </div>

            {data?.scores?.length ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th scope="col" className="py-2 font-medium">차시</th>
                    <th scope="col" className="py-2 text-right font-medium">맞힌 문제</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scores.map((score) => (
                    <tr
                      key={score.lessonNumber}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-2">{score.lessonNumber}차시</td>
                      <td className="py-2 text-right font-bold tabular-nums">
                        {score.correctCount == null
                          ? "미응시"
                          : `${score.correctCount} / ${score.questionCount}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground">
                아직 푼 차시가 없습니다.
              </p>
            )}
          </Card>

          <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
            <div className="grid gap-1">
              <h2 className="text-lg font-bold">
                최근 차시 답안
                {data?.latestLessonNumber ? ` · ${data.latestLessonNumber}차시` : ""}
              </h2>
              <p className="text-muted-foreground">
                접속이 끊기는 등 사정이 있었다면 결과를 고쳐 주세요. 고친 항목은 따로
                표시됩니다.
              </p>
            </div>

            {data?.latestAnswers?.length ? (
              <ul className="m-0 grid list-none gap-2 p-0">
                {data.latestAnswers.map((answer) => (
                  <li
                    key={answer.attemptAnswerId}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">
                        {(answer.questionIndex ?? 0) + 1}. {answer.content}
                      </span>
                      <span className="ml-2 inline-flex gap-1.5">
                        {answer.byTimeout ? (
                          <Tag tone="muted">시간 종료</Tag>
                        ) : null}
                        {answer.isOverridden ? <Tag tone="accent">교사 수정</Tag> : null}
                      </span>
                    </span>

                    <AppSelect
                      items={RESULT_ITEMS}
                      value={answer.result ?? ""}
                      onValueChange={(result) =>
                        onRun(() =>
                          overrideAttemptResult(answer.attemptAnswerId ?? 0, {
                            result: result as "RIGHT" | "WRONG" | "NONE",
                          }),
                        )
                      }
                      placeholder="결과"
                      className="h-9 w-28 shrink-0"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                아직 푼 문제가 없습니다. 학생이 문제를 풀면 여기에서 결과를 고칠 수
                있습니다.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Tag({
  tone,
  children,
}: {
  tone: "muted" | "accent";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium",
        tone === "accent"
          ? "bg-accent text-accent-deep"
          : "bg-secondary text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
