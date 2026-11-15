"use client";

// 지난 차시 — 마감된 차시의 문제, 내 답, 정답과 해설을 읽기 전용으로 본다.
//
// 마감(FINISHED)한 차시만 결과가 열린다. 마감 전에는 정답을 공개하지 않는다는 규칙과 같다.
// 다시 푸는 것이 아니다.

import { useState } from "react";
import { ChevronLeft } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { ResultBadge } from "@/components/student/result-badge";
import { Card } from "@/components/ui/card";
import { useFindMyLessonResult, useFindMyLessons } from "@/api/generated";
import { cn } from "cn";

export function PastLessonsTab({ classroomId }: { classroomId: number }) {
  const [openLessonNumber, setOpenLessonNumber] = useState<number | null>(null);

  const lessons = useFindMyLessons(classroomId);
  const finished = (lessons.data?.data ?? []).filter(
    (lesson) => lesson.status === "FINISHED",
  );

  if (openLessonNumber != null) {
    return (
      <LessonResult
        classroomId={classroomId}
        lessonNumber={openLessonNumber}
        onBack={() => setOpenLessonNumber(null)}
      />
    );
  }

  if (lessons.isPending) {
    return <p className="text-muted-foreground">불러오는 중…</p>;
  }

  if (finished.length === 0) {
    return (
      <Card className="rounded-lg border border-border p-6 shadow-card ring-0">
        <p className="text-muted-foreground">
          선생님이 차시를 마감하면 정답과 해설을 여기에서 볼 수 있어요.
        </p>
      </Card>
    );
  }

  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {finished.map((lesson) => (
        <li key={lesson.lessonNumber}>
          <button
            type="button"
            onClick={() => setOpenLessonNumber(lesson.lessonNumber ?? null)}
            className="flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 text-left shadow-card transition-colors hover:border-muted-foreground"
          >
            <span className="grid gap-0.5">
              <span className="font-bold">{lesson.lessonNumber}차시</span>
              <span className="text-sm text-muted-foreground">{lesson.title}</span>
            </span>
            <span className="text-sm font-medium text-primary-deep">결과 보기</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function LessonResult({
  classroomId,
  lessonNumber,
  onBack,
}: {
  classroomId: number;
  lessonNumber: number;
  onBack: () => void;
}) {
  const result = useFindMyLessonResult(classroomId, lessonNumber);
  const data = result.data?.data;

  return (
    <div className="grid gap-gap">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AppButton variant="outline" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          차시 목록
        </AppButton>
        {data ? (
          <p className="flex items-baseline gap-1.5">
            <b className="text-2xl font-extrabold tabular-nums text-primary-deep">
              {data.correctCount ?? 0}
            </b>
            <span className="text-muted-foreground">/ {data.questionCount}문제</span>
          </p>
        ) : null}
      </div>

      {result.isPending ? (
        <p className="text-muted-foreground">불러오는 중…</p>
      ) : (
        <ul className="m-0 grid list-none gap-gap p-0">
          {data?.questions?.map((question, index) => (
            <li key={question.questionId}>
              <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold whitespace-pre-wrap">
                    {index + 1}. {question.content}
                  </p>
                  <ResultBadge result={question.result} />
                </div>

                {/* 주관식도 options에 정답 문자열이 들어 있다. 보기로 그리면 안 된다.
                    응답에 문제 유형이 없어 답을 적었는지로 가른다. */}
                {question.answerText != null ? (
                  <div className="grid gap-2">
                    <ReviewRow label="내 답" value={question.answerText} />
                    <ReviewRow label="정답" value={question.correctAnswer} />
                  </div>
                ) : question.options?.length ? (
                  <ul className="m-0 grid list-none gap-1.5 p-0">
                    {question.options.map((option) => {
                      const mine = option.id === question.selectedOptionId;
                      const answer = option.id === question.correctOptionId;

                      return (
                        <li
                          key={option.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-md border px-4 py-2.5",
                            answer
                              ? "border-success bg-success-soft font-bold text-success"
                              : mine
                                ? "border-destructive bg-destructive-soft text-destructive"
                                : "border-border",
                          )}
                        >
                          {option.content}
                          {mine ? (
                            <span className="text-sm font-medium">내가 고른 답</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ReviewRow label="정답" value={question.correctAnswer} />
                )}

                {question.result === "NONE" ? (
                  <p className="text-sm text-muted-foreground">
                    답을 내지 못하고 시간이 끝난 문제예요.
                  </p>
                ) : null}

                {question.explanation ? (
                  <ReviewRow label="해설" value={question.explanation} />
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="grid gap-1">
      <span className="text-sm font-bold text-muted-foreground">{label}</span>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}
