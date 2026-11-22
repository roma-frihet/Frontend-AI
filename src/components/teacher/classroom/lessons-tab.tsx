"use client";

// 수업 진행 — 이 반에 차시를 열고, 닫고, 마감한다. 시각을 정해 두면 서버가 대신 열고 마감한다.
//
// 닫기는 학생에게서 잠시 숨기는 것이고 다시 열 수 있다.
// 마감은 되돌릴 수 없다. 마감해야 학생이 정답과 해설을 본다. 그래서 한 번 더 묻는다.
//
// 예약 시각은 시간대를 붙여 보낸다. 서버 시계가 UTC라 없으면 9시간 어긋난다.

import { useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-field";
import { Chip, Panel } from "@/components/teacher/panel";
import { FinishDialog } from "@/components/teacher/classroom/finish-dialog";
import {
  STATUS_LABEL,
  STATUS_TONE,
  formatSchedule,
  toLocalInput,
  toOffsetDateTime,
  type LessonStatus,
} from "@/components/teacher/lesson-status";
import { ErrorText, useRun } from "@/components/teacher/use-run";
import {
  cancelLessonSchedule,
  closeLesson,
  openLesson,
  scheduleLesson,
} from "@/api/generated";
import type {
  ClassroomResponseResult,
  LessonResponseClassroomStatus,
  LessonResponseResult,
} from "@/api/generated/model";

export const statusIn = (lesson: LessonResponseResult, classroomId?: number) =>
  lesson.classrooms?.find((room) => room.classroomId === classroomId);

export function LessonsTab({
  classroom,
  courseLabel,
  lessons,
  onView,
}: {
  classroom: ClassroomResponseResult;
  courseLabel: string;
  lessons: LessonResponseResult[];
  onView: (lessonNumber: number) => void;
}) {
  const { run, busy, error } = useRun();
  const [finishing, setFinishing] = useState<number | null>(null);
  const [scheduling, setScheduling] = useState<number | null>(null);

  return (
    <>
      <p className="rounded-md bg-primary-soft px-4 py-3 text-sm">
        차시와 문제는 {courseLabel}의 모든 반이 함께 씁니다. 여기서는{" "}
        <strong>이 반에 열고 닫는 것</strong>만 합니다. 새 차시나 문제는{" "}
        <Link href="/teacher/prepare" className="font-bold text-primary-deep hover:underline">
          차시·문제 준비
        </Link>
        에서 만드세요.
      </p>

      <ErrorText error={error} />

      {lessons.length === 0 ? (
        <Panel>
          <p className="text-muted-foreground">
            아직 차시가 없습니다. 차시·문제 준비에서 차시와 문제를 만들면 여기에서 열 수
            있습니다.
          </p>
        </Panel>
      ) : (
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {lessons.map((lesson) => {
            const number = lesson.lessonNumber ?? 0;
            return (
              <LessonRow
                key={number}
                classroomId={classroom.id ?? 0}
                prepareHref={`/teacher/prepare?course=${classroom.courseId}&lesson=${number}`}
                lesson={lesson}
                state={statusIn(lesson, classroom.id)}
                busy={busy}
                scheduleOpen={scheduling === number}
                onToggleSchedule={() => setScheduling(scheduling === number ? null : number)}
                onView={() => onView(number)}
                onFinish={() => setFinishing(number)}
                onRun={(task) =>
                  void run(task).then((ok) => {
                    if (ok) setScheduling(null);
                  })
                }
              />
            );
          })}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">
        닫기는 학생에게 잠시 숨기는 것이고 다시 열 수 있습니다. 마감하면 다시 열 수 없고,
        학생이 정답과 해설을 봅니다.
      </p>

      <FinishDialog
        classroomId={classroom.id ?? 0}
        lessonNumber={finishing}
        label={`${classroom.classNo}반 ${finishing}차시`}
        busy={busy}
        onClose={() => setFinishing(null)}
        onRun={(task) => void run(task)}
      />
    </>
  );
}

function LessonRow({
  classroomId,
  prepareHref,
  lesson,
  state,
  busy,
  scheduleOpen,
  onToggleSchedule,
  onView,
  onFinish,
  onRun,
}: {
  classroomId: number;
  prepareHref: string;
  lesson: LessonResponseResult;
  state?: LessonResponseClassroomStatus;
  busy: boolean;
  scheduleOpen: boolean;
  onToggleSchedule: () => void;
  onView: () => void;
  onFinish: () => void;
  onRun: (task: () => Promise<unknown>) => void;
}) {
  const number = lesson.lessonNumber ?? 0;
  const status = (state?.status ?? "PLANNED") as LessonStatus;
  const hasQuestion = (lesson.questionCount ?? 0) > 0;
  const scheduled = Boolean(state?.scheduledOpenAt || state?.scheduledFinishAt);

  const scheduleText = [
    state?.scheduledOpenAt ? `${formatSchedule(state.scheduledOpenAt)} 열기` : null,
    state?.scheduledFinishAt ? `${formatSchedule(state.scheduledFinishAt)} 자동 마감` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <strong className="min-w-14 text-primary-deep">{number}차시</strong>
        <span className="grid min-w-0 flex-1 basis-48 gap-0.5">
          <button
            type="button"
            onClick={onView}
            className="w-fit text-left font-bold hover:underline"
          >
            {lesson.title}
          </button>
          <span className="text-sm text-muted-foreground">
            문제 {lesson.questionCount ?? 0}개
            {scheduleText ? (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <CalendarClock className="size-3.5" aria-hidden />
                  {scheduleText}
                </span>
              </>
            ) : null}
          </span>
        </span>
        <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>

        <span className="flex flex-wrap gap-2">
          <AppButton variant="outline" className="h-9 px-3" onClick={onView}>
            차시 보기
          </AppButton>
          {status === "FINISHED" ? null : !hasQuestion ? (
            <Link
              href={prepareHref}
              className="inline-flex h-9 items-center px-1 text-sm font-bold text-primary-deep hover:underline"
            >
              문제 넣으러 가기 →
            </Link>
          ) : (
            <>
              {scheduled ? (
                <AppButton
                  variant="outline"
                  className="h-9 px-3"
                  disabled={busy}
                  onClick={() => onRun(() => cancelLessonSchedule(classroomId, number))}
                >
                  예약 취소
                </AppButton>
              ) : (
                <AppButton
                  variant="outline"
                  className="h-9 px-3"
                  aria-expanded={scheduleOpen}
                  onClick={onToggleSchedule}
                >
                  {status === "OPEN" ? "자동 마감" : "예약"}
                </AppButton>
              )}
              {status === "OPEN" ? (
                <AppButton
                  variant="outline"
                  className="h-9 px-3"
                  disabled={busy}
                  onClick={() => onRun(() => closeLesson(classroomId, number))}
                >
                  닫기
                </AppButton>
              ) : (
                <AppButton
                  className="h-9 px-3"
                  disabled={busy}
                  onClick={() => onRun(() => openLesson(classroomId, number))}
                >
                  {status === "CLOSED" ? "다시 열기" : "지금 열기"}
                </AppButton>
              )}
              {status === "PLANNED" ? null : (
                <AppButton
                  variant="outline"
                  className="h-9 px-3 text-destructive hover:bg-destructive-soft"
                  disabled={busy}
                  onClick={onFinish}
                >
                  마감
                </AppButton>
              )}
            </>
          )}
        </span>
      </div>

      {scheduleOpen ? (
        <ScheduleForm
          isOpen={status === "OPEN"}
          busy={busy}
          onCancel={onToggleSchedule}
          onSave={(openAt, finishAt) =>
            onRun(() => scheduleLesson(classroomId, number, { openAt, finishAt }))
          }
        />
      ) : null}
    </li>
  );
}

const HOUR_MS = 60 * 60 * 1000;

function ScheduleForm({
  isOpen,
  busy,
  onCancel,
  onSave,
}: {
  /** 이미 열린 차시는 마감 시각만 정한다. */
  isOpen: boolean;
  busy: boolean;
  onCancel: () => void;
  onSave: (openAt: string | null, finishAt: string | null) => void;
}) {
  const [openAt, setOpenAt] = useState(() => toLocalInput(new Date(Date.now() + HOUR_MS)));
  const [finishAt, setFinishAt] = useState("");

  const invalid =
    (!isOpen && !openAt) ||
    (isOpen && !finishAt) ||
    (!isOpen && Boolean(finishAt) && finishAt <= openAt);

  return (
    <form
      className="grid gap-3 rounded-md bg-secondary p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (invalid) return;
        onSave(
          isOpen ? null : toOffsetDateTime(openAt),
          finishAt ? toOffsetDateTime(finishAt) : null,
        );
      }}
    >
      <strong>{isOpen ? "자동 마감" : "열기 예약"}</strong>
      <div className="flex flex-wrap items-end gap-3">
        {isOpen ? null : (
          <label className="grid gap-1.5 text-sm font-bold">
            열 시각
            <AppInput
              type="datetime-local"
              value={openAt}
              onChange={(event) => setOpenAt(event.target.value)}
              className="w-auto bg-card"
            />
          </label>
        )}
        <label className="grid gap-1.5 text-sm font-bold">
          자동 마감 시각{isOpen ? "" : " (선택)"}
          <AppInput
            type="datetime-local"
            value={finishAt}
            min={isOpen ? undefined : openAt}
            onChange={(event) => setFinishAt(event.target.value)}
            className="w-auto bg-card"
          />
        </label>
        <AppButton type="submit" className="h-11" disabled={busy || invalid}>
          저장
        </AppButton>
        <AppButton type="button" variant="outline" className="h-11" onClick={onCancel}>
          취소
        </AppButton>
      </div>
      <p className="text-sm text-muted-foreground">
        마감 시각이 되면 자동으로 마감되어 학생이 정답과 해설을 봅니다. 마감은 되돌릴 수
        없습니다.
        {isOpen
          ? null
          : " 열 시각에 열리지 못한 채 마감 시각이 지나면 예약이 지워집니다. 그때는 지금 열기로 직접 열어 주세요."}
      </p>
    </form>
  );
}
