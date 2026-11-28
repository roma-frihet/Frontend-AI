"use client";

// 학생 화면 미리보기 — 학생이 보게 될 풀이 화면을 제출 없이 넘겨 본다.
//
// 학생 풀이 API는 쓰지 않는다(응시 기록이 생긴다). 교사용 문제 조회로 화면만 꾸민다.
// 같은 화면 위의 대화상자로 띄우므로 닫으면 보던 화면이 그대로 남아 있다.

import { useState } from "react";
import Image from "next/image";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-field";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoadingState } from "@/components/states";
import { LessonName } from "@/components/lesson-name";
import { useFindQuestions } from "@/api/generated";
import { cn } from "cn";

export function StudentPreview({
  open,
  onOpenChange,
  courseId,
  lessonNumber,
  lessonTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  lessonNumber: number;
  lessonTitle?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-dvh gap-0 overflow-y-auto rounded-lg p-0"
      >
        {open ? (
          <PreviewBody
            courseId={courseId}
            lessonNumber={lessonNumber}
            lessonTitle={lessonTitle}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  courseId,
  lessonNumber,
  lessonTitle,
  onClose,
}: {
  courseId: number;
  lessonNumber: number;
  lessonTitle?: string;
  onClose: () => void;
}) {
  const query = useFindQuestions(courseId, lessonNumber);
  const questions = query.data?.data ?? [];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [texts, setTexts] = useState<Record<number, string>>({});

  const question = questions[index];
  const total = questions.length;

  return (
    <div className="flex min-h-120 flex-col bg-background">
      <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-3 text-sm font-bold text-background">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <DialogTitle className="text-sm font-bold">학생 화면 미리보기</DialogTitle>
          <span className="text-sm font-medium opacity-70">답은 저장되지 않아요</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 rounded-md border border-muted-foreground px-3 text-sm font-bold"
        >
          닫기
        </button>
      </div>

      {query.isPending ? (
        <LoadingState className="p-5 text-muted-foreground" />
      ) : !question ? (
        <p className="p-5 text-muted-foreground">
          아직 문제가 없어요. 문제를 넣으면 학생 화면을 미리 볼 수 있어요.
        </p>
      ) : (
        <>
          <div className="grid gap-2.5 border-b border-border bg-card px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                <LessonName number={lessonNumber} title={lessonTitle} />
              </span>
              <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-sm font-bold tabular-nums">
                제한 시간 {question.timeLimitSec}초
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <strong className="tabular-nums">
                {index + 1} / {total}
              </strong>
              <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${((index + 1) * 100) / total}%` }}
                />
              </span>
            </div>
          </div>

          <div className="grid flex-1 content-start gap-4 p-5">
            <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-sm font-bold text-muted-foreground">
              {question.type === "SHORT_ANSWER" ? "주관식" : "객관식"}
            </span>
            <p className="text-lg leading-relaxed font-extrabold whitespace-pre-wrap">
              {question.content}
            </p>
            {question.imageUrl ? (
              <Image
                src={question.imageUrl}
                alt=""
                width={800}
                height={450}
                unoptimized
                className="h-auto w-full rounded-md border border-border"
              />
            ) : null}

            {question.type === "SHORT_ANSWER" ? (
              <AppInput
                aria-label="답 쓰기"
                placeholder="여기에 답을 쓰세요"
                value={texts[index] ?? ""}
                onChange={(event) => setTexts({ ...texts, [index]: event.target.value })}
              />
            ) : (
              <div role="radiogroup" aria-label="보기" className="grid gap-2.5">
                {question.options?.map((option, k) => {
                  const on = picked[index] === k;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPicked({ ...picked, [index]: k })}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-lg border-2 bg-card px-4 py-3 text-left",
                        on ? "border-primary bg-primary-soft" : "border-border",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-grid size-7 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                          on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {k + 1}
                      </span>
                      {option.content}
                      {option.imageUrl ? (
                        <Image
                          src={option.imageUrl}
                          alt=""
                          width={160}
                          height={90}
                          unoptimized
                          className="h-auto w-24 rounded-md"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2.5 border-t border-border bg-card px-5 py-4">
            <AppButton
              variant="outline"
              className="h-13 flex-1"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              이전
            </AppButton>
            <AppButton
              className="h-13 flex-1"
              onClick={() => (index + 1 >= total ? onClose() : setIndex(index + 1))}
            >
              {index + 1 >= total ? "미리보기 끝내기" : "다음"}
            </AppButton>
          </div>
        </>
      )}
    </div>
  );
}
