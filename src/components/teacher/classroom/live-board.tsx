"use client";

// 수업 중 화면 — 칠판에 띄우는 큰 화면. 3초마다 다시 받는다.
//
// 정답률과 미제출 학생 이름은 기본으로 숨긴다. 반 전체가 보는 화면이라 누가 아직인지,
// 어느 문제를 많이 틀렸는지가 그대로 드러나면 안 된다. 교사가 필요할 때만 켠다.
//
// 닫으면 열기 전에 보던 차시 상세로 돌아간다(router.back). 이 화면을 바로 열었다면
// 돌아갈 기록이 없으니 그 차시 상세로 보낸다.

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { classroomHref } from "@/components/teacher/classroom/use-classroom-query";
import { LOW_RATE, STATUS_LABEL, percent, type LessonStatus } from "@/components/teacher/lesson-status";
import { Chip } from "@/components/teacher/panel";
import { errorMessage } from "@/components/teacher/use-run";
import {
  useFindClassroomStudents,
  useFindClassrooms,
  useFindLessons,
  useFindQuestionStats,
  useFindScores,
} from "@/api/generated";
import { isId } from "@/lib/id";
import { cn } from "cn";

const REFRESH_MS = 3000;
const PAGE_SIZE = 100;

export function LiveBoard({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId: raw } = use(params);
  const classroomId = Number(raw);
  const lessonNumber = Number(useSearchParams().get("lesson")) || 0;
  const router = useRouter();

  const [showRates, setShowRates] = useState(false);
  const [showNames, setShowNames] = useState(false);

  const classrooms = useFindClassrooms();
  const classroom = classrooms.data?.data.find((room) => room.id === classroomId);
  // courseId는 음수·0일 수도 있다(src/lib/id.ts).
  const courseId = classroom?.courseId;
  const hasCourse = isId(courseId);
  const lessons = useFindLessons(courseId ?? 0, { query: { enabled: hasCourse } });
  const lesson = lessons.data?.data.find((item) => item.lessonNumber === lessonNumber);

  const stats = useFindQuestionStats(
    courseId ?? 0,
    lessonNumber,
    { classroomIds: [classroomId] },
    { query: { enabled: hasCourse && lessonNumber > 0, refetchInterval: REFRESH_MS } },
  );
  const mine = stats.data?.data.find((room) => room.classroomId === classroomId);

  // 이름은 켰을 때만 받는다.
  const students = useFindClassroomStudents(classroomId, {}, { query: { enabled: showNames } });
  const scores = useFindScores(
    courseId ?? 0,
    { classroomId, lessonNumber, size: PAGE_SIZE },
    { query: { enabled: showNames && hasCourse, refetchInterval: REFRESH_MS } },
  );
  const submitted = new Set(
    (scores.data?.data.content ?? [])
      .filter((row) => row.correctCount != null)
      .map((row) => row.membershipId),
  );
  const waiting = (students.data?.data.students ?? []).filter(
    (student) => !submitted.has(student.membershipId),
  );

  const close = () => {
    if (window.history.length > 1) router.back();
    else router.push(classroomHref(classroomId, { tab: "lessons", lesson: lessonNumber }));
  };

  const total = mine?.studentCount ?? classroom?.studentCount ?? 0;
  const responded = mine?.responseCount ?? 0;
  const left = Math.max(total - responded, 0);
  const status = (mine?.status ?? "PLANNED") as LessonStatus;

  return (
    <div className="grid min-h-dvh content-start gap-5 bg-background px-4 py-6 sm:px-9 sm:py-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2.5">
            <Chip tone={status === "OPEN" ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground"}>
              {status === "OPEN" ? (
                <span aria-hidden className="mr-2 size-2 rounded-full bg-success" />
              ) : null}
              {STATUS_LABEL[status]}
            </Chip>
            <span className="text-sm text-muted-foreground">3초마다 갱신</span>
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {classroom ? `${classroom.grade}학년 ${classroom.classNo}반` : "수업 중"} ·{" "}
            {lessonNumber}차시 {lesson?.title ?? ""}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <AppButton variant="outline" aria-pressed={showRates} onClick={() => setShowRates(!showRates)}>
            {showRates ? "정답률 숨기기" : "정답률 보기"}
          </AppButton>
          <AppButton variant="outline" aria-pressed={showNames} onClick={() => setShowNames(!showNames)}>
            {showNames ? "이름 숨기기" : "미제출 학생 이름 보기"}
          </AppButton>
          <AppButton onClick={close}>차시로 돌아가기</AppButton>
        </div>
      </header>

      {stats.isError ? (
        <p role="alert" className="font-medium text-destructive">
          {errorMessage(stats.error)}
        </p>
      ) : null}

      <section
        aria-label="제출 현황"
        className="grid gap-3.5 rounded-2xl border border-border bg-card p-6 shadow-card sm:px-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="flex items-baseline gap-3">
            <span className="text-xl font-bold text-muted-foreground">응답</span>
            <strong className="text-6xl leading-none font-extrabold text-primary-deep tabular-nums">
              {responded}
            </strong>
            <span className="text-3xl font-bold text-muted-foreground tabular-nums">/ {total}</span>
          </p>
          <span
            role="status"
            className={cn(
              "rounded-md px-3.5 py-2 text-xl font-extrabold",
              left === 0 ? "bg-success-soft text-success" : "bg-warning-soft text-foreground",
            )}
          >
            {left === 0 ? "모두 응답했습니다" : `아직 ${left}명`}
          </span>
        </div>
        <span aria-hidden className="h-4 overflow-hidden rounded-full bg-secondary">
          <span
            className="block h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent(responded, total) ?? 0}%` }}
          />
        </span>
      </section>

      <section
        aria-label="문제별 현황"
        className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5"
      >
        {[...(mine?.questions ?? [])]
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((question, index) => {
          const answered = question.answeredCount ?? 0;
          const rate = percent(question.rightCount ?? 0, responded);
          const low = showRates && rate != null && rate < LOW_RATE * 100;
          return (
            <div
              key={question.questionId}
              className={cn(
                "grid gap-2.5 rounded-xl border-2 bg-card p-4 shadow-card",
                low ? "border-warning" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xl font-extrabold">
                  {index + 1}번
                </strong>
                <Chip tone="bg-secondary text-muted-foreground" className="text-xs">
                  {question.type === "SHORT_ANSWER" ? "주관식" : "객관식"}
                </Chip>
              </div>
              <strong className="text-4xl leading-none font-extrabold tabular-nums">
                {showRates ? (rate == null ? "–" : `${rate}%`) : `${answered}명`}
              </strong>
              <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    !showRates ? "bg-success" : low ? "bg-warning" : "bg-primary",
                  )}
                  style={{
                    width: `${(showRates ? rate : percent(answered, total)) ?? 0}%`,
                  }}
                />
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {showRates
                  ? `정답 ${question.rightCount ?? 0} / ${responded}명`
                  : "응답 완료"}
              </span>
            </div>
          );
        })}
      </section>

      {showNames ? (
        <section
          aria-label="아직 답하지 않은 학생"
          className="flex flex-wrap items-center gap-2.5 rounded-xl border border-warning bg-warning-soft px-5 py-4"
        >
          <strong className="mr-2 text-lg">아직 답하지 않은 학생</strong>
          {waiting.length === 0 ? (
            <span className="text-muted-foreground">모두 답했습니다.</span>
          ) : (
            waiting.map((student) => (
              <span
                key={student.membershipId}
                className="rounded-full border border-warning bg-card px-3 py-1.5 font-bold"
              >
                {student.studentName}
              </span>
            ))
          )}
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          학생 이름은 숨겨져 있습니다. 칠판 화면에 띄울 때는 이름을 숨긴 채로 두세요.
        </p>
      )}
    </div>
  );
}
