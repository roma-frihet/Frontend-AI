"use client";

// 차시 상세 — 이 반에서 한 차시를 열고 마감하고, 결과를 세 가지로 본다.
//
//   문제별: 정답률과 응답 분포, 주관식 일괄 인정
//   학생별: 학생 한 명의 풀이, 개별 정답 인정
//   반 비교: 같은 차시를 연 다른 반과 나란히
//
// 수업 중 화면은 별도 경로로 연다. 닫으면 router.back()으로 이 화면(같은 쿼리)에 돌아온다.
// 학생 화면 미리보기는 대화상자라 닫아도 이 화면이 그대로다.

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MonitorPlay } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { ClassCompare } from "@/components/teacher/classroom/class-compare";
import { FinishDialog } from "@/components/teacher/classroom/finish-dialog";
import { LessonStudents } from "@/components/teacher/classroom/lesson-students";
import { statusIn } from "@/components/teacher/classroom/lessons-tab";
import { QuestionResults } from "@/components/teacher/classroom/question-results";
import type { LessonView } from "@/components/teacher/classroom/use-classroom-query";
import {
  LOW_RATE,
  STATUS_LABEL,
  STATUS_TONE,
  percent,
  type LessonStatus,
} from "@/components/teacher/lesson-status";
import { StudentPreview } from "@/components/teacher/student-preview";
import { useRun } from "@/components/teacher/use-run";
import { ErrorText, LoadingState } from "@/components/states";
import { Chip, Panel } from "@/components/surface";
import { TextButton, TextLink, ToggleChip } from "@/components/text-action";
import {
  closeLesson,
  openLesson,
  useFindQuestionStats,
  useFindQuestions,
} from "@/api/generated";
import type {
  ClassroomResponseResult,
  LessonResponseResult,
} from "@/api/generated/model";

const VIEWS: { value: LessonView; label: string }[] = [
  { value: "questions", label: "문제별" },
  { value: "students", label: "학생별" },
  { value: "compare", label: "반 비교" },
];

export function LessonDetail({
  classroom,
  lesson,
  view,
  student,
  onView,
  onBack,
}: {
  classroom: ClassroomResponseResult;
  lesson: LessonResponseResult;
  view: LessonView;
  student: number | null;
  onView: (view: LessonView, student?: number | null) => void;
  onBack: () => void;
}) {
  const classroomId = classroom.id ?? 0;
  const courseId = classroom.courseId ?? 0;
  const number = lesson.lessonNumber ?? 0;
  const state = statusIn(lesson, classroomId);
  const status = (state?.status ?? "PLANNED") as LessonStatus;
  const opened = status !== "PLANNED";
  const hasQuestion = (lesson.questionCount ?? 0) > 0;

  const stats = useFindQuestionStats(
    courseId,
    number,
    { classroomIds: [classroomId] },
    { query: { enabled: opened } },
  );
  const mine = stats.data?.data.find((room) => room.classroomId === classroomId);

  const { run, busy, error } = useRun();
  const [finishing, setFinishing] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const questions = mine?.questions ?? [];
  const responders = mine?.responseCount ?? 0;
  const studentCount = mine?.studentCount ?? classroom.studentCount ?? 0;
  const rightSum = questions.reduce((sum, item) => sum + (item.rightCount ?? 0), 0);
  const lowCount = questions.filter((item) => {
    const rate = percent(item.rightCount ?? 0, responders);
    return rate != null && rate < LOW_RATE * 100;
  }).length;

  const course = `${classroom.grade}학년 ${classroom.subjectName}`;

  return (
    <>
      <TextButton size="sm" onClick={onBack}>
        <ChevronLeft className="size-4" aria-hidden />
        차시 목록
      </TextButton>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold">
                {number}차시 · {lesson.title}
              </h2>
              <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
            </div>
            <span className="text-sm text-muted-foreground">
              {classroom.classNo}반 기준 · 문제 {lesson.questionCount ?? 0}개
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "FINISHED" || !hasQuestion ? null : status === "OPEN" ? (
              <AppButton
                variant="outline"
                disabled={busy}
                onClick={() => void run(() => closeLesson(classroomId, number))}
              >
                닫기
              </AppButton>
            ) : (
              <AppButton
                disabled={busy}
                onClick={() => void run(() => openLesson(classroomId, number))}
              >
                {status === "CLOSED" ? "다시 열기" : "이 반에 열기"}
              </AppButton>
            )}
            {status === "OPEN" || status === "CLOSED" ? (
              <AppButton
                variant="outline"
                className="text-destructive hover:bg-destructive-soft"
                disabled={busy}
                onClick={() => setFinishing(true)}
              >
                마감
              </AppButton>
            ) : null}
            {status === "OPEN" ? (
              <Link
                href={`/teacher/classrooms/${classroomId}/live?lesson=${number}`}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-bold text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                <MonitorPlay className="size-4" aria-hidden />
                수업 화면 띄우기
              </Link>
            ) : null}
            {hasQuestion ? (
              <AppButton variant="outline" onClick={() => setPreviewing(true)}>
                학생 화면 미리보기
              </AppButton>
            ) : null}
            <TextLink
              href={`/teacher/prepare?course=${courseId}&lesson=${number}`}
              className="h-11 px-2"
            >
              문제 수정
            </TextLink>
          </div>
        </div>
        <ErrorText error={error} />
      </Panel>

      {!opened ? (
        <NotOpened courseId={courseId} lessonNumber={number} />
      ) : stats.isPending ? (
        <LoadingState />
      ) : (
        <>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4">
            <Stat
              label="응답한 학생"
              value={`${responders} / ${studentCount}`}
              hint={
                studentCount - responders > 0
                  ? `아직 ${studentCount - responders}명`
                  : "모두 응답했어요"
              }
            />
            <Stat
              label="평균 맞힌 문제"
              value={responders ? `${(rightSum / responders).toFixed(1)} / ${questions.length}` : "–"}
              hint="응답한 학생 기준"
            />
            <Stat
              label="전체 정답률"
              value={
                responders && questions.length
                  ? `${percent(rightSum, responders * questions.length)}%`
                  : "–"
              }
              hint="모든 문제를 합쳐서"
            />
            <Stat
              label="다시 짚을 문제"
              value={`${lowCount}개`}
              hint="정답률 50% 미만"
            />
          </ul>

          <div role="group" aria-label="결과 보기 방식" className="flex flex-wrap gap-2">
            {VIEWS.map((item) => (
              <ToggleChip
                key={item.value}
                pressed={view === item.value}
                onClick={() => onView(item.value)}
              >
                {item.label}
              </ToggleChip>
            ))}
          </div>

          {view === "students" ? (
            <LessonStudents
              courseId={courseId}
              classroomId={classroomId}
              lessonNumber={number}
              selected={student}
              onSelect={(membershipId) => onView("students", membershipId)}
            />
          ) : view === "compare" ? (
            <ClassCompare
              courseId={courseId}
              courseLabel={course}
              lessonNumber={number}
              classroomId={classroomId}
            />
          ) : mine ? (
            <QuestionResults classroomId={classroomId} lessonNumber={number} stats={mine} />
          ) : null}
        </>
      )}

      <FinishDialog
        classroomId={classroomId}
        lessonNumber={finishing ? number : null}
        label={`${classroom.classNo}반 ${number}차시`}
        busy={busy}
        onClose={() => setFinishing(false)}
        onRun={(task) => void run(task)}
      />

      <StudentPreview
        open={previewing}
        onOpenChange={setPreviewing}
        courseId={courseId}
        lessonNumber={number}
        lessonTitle={lesson.title}
      />
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Panel as="li" size="sm" className="gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <strong className="text-2xl font-extrabold tabular-nums">{value}</strong>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </Panel>
  );
}

function NotOpened({ courseId, lessonNumber }: { courseId: number; lessonNumber: number }) {
  const questions = useFindQuestions(courseId, lessonNumber);
  const list = questions.data?.data ?? [];

  return (
    <Panel>
      <p className="text-muted-foreground">
        아직 열지 않은 차시예요. 열면 제출 현황과 정답률을 여기에서 볼 수 있어요.
      </p>
      {questions.isPending ? (
        <LoadingState />
      ) : list.length === 0 ? (
        <p>
          문제가 없어서 열 수 없어요.{" "}
          <TextLink
            href={`/teacher/prepare?course=${courseId}&lesson=${lessonNumber}`}
          >
            문제 넣으러 가기
          </TextLink>
        </p>
      ) : (
        <ol className="m-0 grid list-none gap-2 p-0">
          {list.map((question, index) => (
            <li
              key={question.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
            >
              <strong className="text-muted-foreground tabular-nums">{index + 1}</strong>
              <Chip tone="bg-secondary text-muted-foreground">
                {question.type === "SHORT_ANSWER" ? "주관식" : "객관식"}
              </Chip>
              <span className="min-w-0 flex-1">{question.content ?? "그림 문제"}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
