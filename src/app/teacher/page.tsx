"use client";

// 학급 관리 — 교사 화면의 첫 화면.
//
// 지금 진행 중인 반을 맨 위에 두고, 학년·과목별로 반 카드를 늘어놓는다.
// 반을 누르면 그 반에서 차시를 열고, 학생과 성적을 본다.
//
// 반 카드 숫자는 summaries가 준다. 수업(학년·과목) 목록과 차시 수는 마이페이지 응답에 있다.
// 반이 없는 수업도 보여야 하므로 수업 목록을 기준으로 묶는다.

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { ConfirmDelete, losses, withParticle } from "@/components/teacher/confirm-delete";
import { CreateClassroomDialog } from "@/components/teacher/create-classroom-dialog";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useRun } from "@/components/teacher/use-run";
import { ErrorText, LoadingState } from "@/components/states";
import { Chip, Panel, panelClass } from "@/components/surface";
import { IconButton } from "@/components/text-action";
import { deleteCourse, useFindClassroomSummaries, useFindMyPage } from "@/api/generated";
import { cn } from "cn";
import type {
  ReportResponseClassroomSummary,
  TeacherResponseCourse,
} from "@/api/generated/model";

export default function TeacherHomePage() {
  const mypage = useFindMyPage();
  const courses = mypage.data?.data.courses ?? [];
  const profile = mypage.data?.data.profile;
  const summaries = useFindClassroomSummaries();
  const rooms = summaries.data?.data ?? [];

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TeacherResponseCourse | null>(null);
  const { run, busy, error } = useRun();

  const live = rooms.filter((room) => room.openLesson);
  const pending = mypage.isPending || summaries.isPending;

  return (
    <TeacherShell
      title="학급 관리"
      description="반을 눌러 차시를 열고, 학생과 성적을 확인하세요."
      actions={
        <AppButton onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden />
          반 만들기
        </AppButton>
      }
    >
      {pending ? (
        <LoadingState />
      ) : courses.length === 0 ? (
        <Panel>
          <h2 className="text-lg font-bold">첫 반을 만들어 주세요</h2>
          <p className="text-muted-foreground">
            학년·과목과 반 번호를 고르면 바로 학생을 모을 수 있어요.
          </p>
          <AppButton className="justify-self-start" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            반 만들기
          </AppButton>
        </Panel>
      ) : (
        <>
          {live.length > 0 ? (
            <section
              aria-labelledby="live-title"
              className="grid gap-3 rounded-lg bg-success-soft p-5"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full bg-success" />
                <h2 id="live-title" className="font-bold">
                  지금 진행 중
                </h2>
                <span className="text-sm text-muted-foreground">{live.length}개 반</span>
              </div>
              <ul className="m-0 grid list-none gap-2 p-0">
                {live.map((room) => (
                  <li key={room.classroomId}>
                    <Link
                      href={`/teacher/classrooms/${room.classroomId}?tab=lessons&lesson=${room.openLesson?.lessonNumber}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border bg-card px-4 py-3 transition-colors hover:border-success"
                    >
                      <strong className="min-w-28">
                        {room.grade}학년 {room.classNo}반
                      </strong>
                      <span className="min-w-0 flex-1 text-muted-foreground">
                        {room.openLesson?.lessonNumber}차시 · {room.openLesson?.title}
                      </span>
                      <span className="font-bold text-success tabular-nums">
                        응답 {room.openLesson?.responseCount ?? 0} / {room.studentCount ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-primary-deep">
                        반으로 가기
                        <ArrowRight className="size-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {courses.map((course) => (
            <CourseSection
              key={course.id}
              course={course}
              rooms={rooms.filter((room) => room.courseId === course.id)}
              busy={busy}
              onCreate={() => setCreating(true)}
              onDelete={() => setDeleting(course)}
            />
          ))}
          <ErrorText error={error} />
        </>
      )}

      <CreateClassroomDialog
        open={creating}
        onOpenChange={setCreating}
        courses={courses}
        schoolId={profile?.schoolId ?? null}
      />

      <ConfirmDelete
        open={deleting != null}
        onOpenChange={() => setDeleting(null)}
        title={`${deleting?.grade}학년 ${withParticle(deleting?.subjectName ?? "")} 지울까요?`}
        losses={losses(
          { count: deleting?.classrooms?.length ?? 0, label: "반", unit: "개" },
          {
            count: rooms
              .filter((room) => room.courseId === deleting?.id)
              .reduce((sum, room) => sum + (room.studentCount ?? 0), 0),
            label: "학생",
            unit: "명",
          },
          { count: deleting?.lessonCount ?? 0, label: "차시", unit: "개" },
        )}
        busy={busy}
        onConfirm={() => {
          const id = deleting?.id ?? 0;
          setDeleting(null);
          void run(() => deleteCourse(id));
        }}
      />
    </TeacherShell>
  );
}

function CourseSection({
  course,
  rooms,
  busy,
  onCreate,
  onDelete,
}: {
  course: TeacherResponseCourse;
  rooms: ReportResponseClassroomSummary[];
  busy: boolean;
  onCreate: () => void;
  onDelete: () => void;
}) {
  const sorted = [...rooms].sort((a, b) => (a.classNo ?? 0) - (b.classNo ?? 0));

  return (
    <section aria-labelledby={`course-${course.id}`} className="grid gap-3.5">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 id={`course-${course.id}`} className="text-xl font-extrabold">
          {course.grade}학년 {course.subjectName}
        </h2>
        <span className="text-sm text-muted-foreground">
          차시 {course.lessonCount ?? 0}개
        </span>
        <IconButton
          tone="danger"
          aria-label={`${course.grade}학년 ${course.subjectName} 삭제`}
          disabled={busy}
          onClick={onDelete}
          className="ml-auto"
        >
          <Trash2 className="size-4" aria-hidden />
        </IconButton>
      </div>

      {sorted.length === 0 ? (
        <Panel>
          <p className="text-muted-foreground">
            아직 반이 없어요. 반을 만들면 학생을 모으고 차시를 열 수 있어요.
          </p>
          <AppButton variant="outline" className="justify-self-start" onClick={onCreate}>
            <Plus className="size-4" aria-hidden />
            반 만들기
          </AppButton>
        </Panel>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 p-0">
          {sorted.map((room) => (
            <li key={room.classroomId}>
              <ClassCard room={room} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ClassCard({ room }: { room: ReportResponseClassroomSummary }) {
  const open = room.openLesson;
  const status = open
    ? `${open.lessonNumber}차시 진행 중`
    : room.lastFinishedLessonNumber
      ? `열린 차시 없음 · ${room.lastFinishedLessonNumber}차시까지 마감`
      : "열린 차시 없음";
  const watch = room.watchStudentCount ?? 0;

  return (
    <Link
      href={`/teacher/classrooms/${room.classroomId}`}
      className={cn(panelClass({ interactive: true }), "h-full gap-3.5")}
    >
      <span className="flex items-center justify-between gap-2">
        <strong className="text-2xl font-extrabold">{room.classNo}반</strong>
        <span className="text-sm text-muted-foreground">
          학생 {room.studentCount ?? 0}명
        </span>
      </span>
      <Chip tone={open ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground"}>
        {status}
      </Chip>
      <span className="grid grid-cols-2 gap-2 border-t border-border pt-3">
        <span className="grid gap-0.5">
          <span className="text-sm text-muted-foreground">
            최근 평균{room.latestLessonNumber ? ` · ${room.latestLessonNumber}차시` : ""}
          </span>
          <span className="font-bold tabular-nums">
            {room.latestAverageCorrect == null
              ? "–"
              : `${room.latestAverageCorrect.toFixed(1)} / ${room.latestQuestionCount ?? 0}`}
          </span>
        </span>
        <span className="grid gap-0.5">
          <span className="text-sm text-muted-foreground">살펴볼 학생</span>
          <span className="inline-flex items-center gap-1.5 font-bold">
            {watch > 0 ? (
              <span aria-hidden className="size-2 rounded-full bg-warning" />
            ) : null}
            {watch > 0 ? `${watch}명` : "없음"}
          </span>
        </span>
      </span>
    </Link>
  );
}
