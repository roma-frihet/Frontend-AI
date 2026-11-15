"use client";

// 반마다 차시를 열고 닫고 마감한다.
//
//   안 열림(PLANNED) → 열림(OPEN) ⇄ 닫힘(CLOSED) → 마감(FINISHED)
//
// 닫기는 학생에게서 숨기는 것이고 다시 열 수 있다.
// 마감은 되돌릴 수 없다. 마감해야 학생이 정답과 해설을 본다. 그래서 한 번 더 묻는다.
//
// 닫거나 마감해도 이미 풀고 있던 학생은 그 문제를 끝까지 낸다. 새 문제 시작만 막힌다.

import { useState } from "react";

import { AppButton } from "@/components/app-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { closeLesson, finishLesson, openLesson } from "@/api/generated";
import type { LessonResponseClassroomStatus } from "@/api/generated/model";
import { cn } from "cn";

const LABEL = {
  PLANNED: "안 열림",
  OPEN: "열림",
  CLOSED: "닫힘",
  FINISHED: "마감",
} as const;

const TONE = {
  PLANNED: "bg-secondary text-muted-foreground",
  OPEN: "bg-success-soft text-success",
  CLOSED: "bg-warning-soft text-warning",
  FINISHED: "bg-secondary text-muted-foreground",
} as const;

export function LessonOpenControls({
  lessonNumber,
  classrooms,
  hasQuestion,
  busy,
  onRun,
}: {
  lessonNumber: number;
  classrooms: LessonResponseClassroomStatus[];
  hasQuestion: boolean;
  busy: boolean;
  onRun: (task: () => Promise<unknown>) => void;
}) {
  const [finishing, setFinishing] = useState<LessonResponseClassroomStatus | null>(
    null,
  );

  return (
    <div className="grid gap-2">
      {classrooms.length === 0 ? (
        <p className="text-muted-foreground">반이 없습니다. 마이페이지에서 추가하세요.</p>
      ) : null}

      {classrooms.map((classroom) => {
        const status = classroom.status ?? "PLANNED";
        const id = classroom.classroomId ?? 0;

        return (
          <div
            key={id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
          >
            <span className="font-bold">{classroom.classNo}반</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold",
                TONE[status],
              )}
            >
              {LABEL[status]}
            </span>

            <span className="ml-auto flex flex-wrap gap-2">
              {status === "FINISHED" ? (
                <span className="text-sm text-muted-foreground">
                  되돌릴 수 없습니다
                </span>
              ) : (
                <>
                  {status === "OPEN" ? (
                    <AppButton
                      variant="outline"
                      className="h-9 px-3"
                      disabled={busy}
                      onClick={() => onRun(() => closeLesson(id, lessonNumber))}
                    >
                      닫기
                    </AppButton>
                  ) : (
                    <AppButton
                      className="h-9 px-3"
                      disabled={busy || !hasQuestion}
                      onClick={() => onRun(() => openLesson(id, lessonNumber))}
                    >
                      {status === "CLOSED" ? "다시 열기" : "열기"}
                    </AppButton>
                  )}
                  {status === "PLANNED" ? null : (
                    <AppButton
                      variant="outline"
                      className="h-9 px-3 text-destructive hover:bg-destructive-soft"
                      disabled={busy}
                      onClick={() => setFinishing(classroom)}
                    >
                      마감
                    </AppButton>
                  )}
                </>
              )}
            </span>
          </div>
        );
      })}

      {!hasQuestion && classrooms.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          문제가 없는 차시는 열 수 없습니다.
        </p>
      ) : null}

      <Dialog open={finishing != null} onOpenChange={() => setFinishing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{finishing?.classNo}반 {lessonNumber}차시를 마감할까요?</DialogTitle>
            <DialogDescription>
              마감하면 되돌릴 수 없습니다. 학생이 내 답과 정답, 해설을 볼 수 있게 됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<AppButton variant="outline">취소</AppButton>}
            />
            <AppButton
              className="bg-destructive hover:bg-destructive/90"
              disabled={busy}
              onClick={() => {
                const id = finishing?.classroomId ?? 0;
                setFinishing(null);
                onRun(() => finishLesson(id, lessonNumber));
              }}
            >
              마감하기
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
