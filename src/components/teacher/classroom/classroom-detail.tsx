"use client";

// 반 상세 — 한 반에서 수업을 진행하고(수업 진행), 학생을 보고(학생), 결과를 모아 본다(성적).
//
// 차시와 문제는 같은 학년·과목의 반들이 함께 쓴다. 여기서는 이 반에 열고 닫는 것만 한다.

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";

import {
  AppTabs,
  AppTabsContent,
  AppTabsList,
  AppTabsTrigger,
} from "@/components/app-tabs";
import { ConfirmDelete, losses } from "@/components/teacher/confirm-delete";
import { JoinCodeCard } from "@/components/teacher/join-code-card";
import { Panel } from "@/components/teacher/panel";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { ErrorText, LoadError, useRun } from "@/components/teacher/use-run";
import { LessonDetail } from "@/components/teacher/classroom/lesson-detail";
import { LessonsTab } from "@/components/teacher/classroom/lessons-tab";
import { ScoresTab } from "@/components/teacher/classroom/scores-tab";
import { StudentPanel } from "@/components/teacher/classroom/student-panel";
import { StudentsTab } from "@/components/teacher/classroom/students-tab";
import {
  useClassroomQuery,
  type ClassroomTab,
} from "@/components/teacher/classroom/use-classroom-query";
import { useRefreshOnChange } from "@/components/teacher/use-refresh";
import { deleteClassroom, useFindClassrooms, useFindLessons } from "@/api/generated";
import { isId } from "@/lib/id";

export function ClassroomDetail({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId: raw } = use(params);
  const classroomId = Number(raw);
  const router = useRouter();
  const { query, go } = useClassroomQuery();
  // 탭·차시·보기 방식·학생을 옮기면 그 화면을 새로 받는다.
  useRefreshOnChange(`${query.tab}|${query.lesson}|${query.view}|${query.student}`);

  const classrooms = useFindClassrooms();
  const classroom = classrooms.data?.data.find((room) => room.id === classroomId);
  // courseId는 음수·0일 수도 있다(src/lib/id.ts). 양수로 거르면 차시 요청이 아예 나가지 않는다.
  const courseId = classroom?.courseId;

  const lessons = useFindLessons(courseId ?? 0, { query: { enabled: isId(courseId) } });
  const lessonList = lessons.data?.data ?? [];

  const { run, busy, error } = useRun();
  const [deleting, setDeleting] = useState(false);

  if (classrooms.isError) {
    return (
      <TeacherShell title="반">
        <Panel>
          <LoadError error={classrooms.error} onRetry={() => void classrooms.refetch()} />
        </Panel>
      </TeacherShell>
    );
  }

  if (classrooms.isPending) {
    return (
      <TeacherShell title="반">
        <p className="text-muted-foreground">불러오는 중…</p>
      </TeacherShell>
    );
  }

  if (!classroom) {
    return (
      <TeacherShell title="반을 찾을 수 없어요">
        <Panel>
          <p className="text-muted-foreground">
            지워졌거나 다른 선생님의 반이에요. 학급 관리에서 반을 다시 골라 주세요.
          </p>
          <Link href="/teacher" className="font-bold text-primary-deep hover:underline">
            학급 관리로 가기
          </Link>
        </Panel>
      </TeacherShell>
    );
  }

  const name = `${classroom.grade}학년 ${classroom.classNo}반`;
  const course = `${classroom.grade}학년 ${classroom.subjectName}`;
  const lesson = lessonList.find((item) => item.lessonNumber === query.lesson);

  return (
    <TeacherShell
      title={`${name} · ${classroom.subjectName}`}
      description={`학생 ${classroom.studentCount ?? 0}명`}
      actions={
        <>
          <JoinCodeCard classroom={classroom} busy={busy} onRun={(task) => void run(task)} />
          <button
            type="button"
            aria-label={`${name} 삭제`}
            disabled={busy}
            onClick={() => setDeleting(true)}
            className="inline-grid size-11 place-items-center self-center rounded-full text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4.5" aria-hidden />
          </button>
        </>
      }
    >
      <Link
        href="/teacher"
        className="-mt-3 -mb-2 inline-flex w-fit items-center gap-1 text-sm font-bold text-primary-deep hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden />
        학급 관리
      </Link>

      <ErrorText error={error} />

      <AppTabs
        value={query.tab}
        onValueChange={(tab) => go({ tab: tab as ClassroomTab })}
        className="min-w-0 gap-gap"
      >
        <AppTabsList aria-label="반 관리">
          <AppTabsTrigger value="lessons">수업 진행</AppTabsTrigger>
          <AppTabsTrigger value="students">학생</AppTabsTrigger>
          <AppTabsTrigger value="scores">성적</AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value="lessons" className="grid gap-gap">
          {lessons.isError ? (
            <Panel>
              <LoadError error={lessons.error} onRetry={() => void lessons.refetch()} />
            </Panel>
          ) : !isId(courseId) ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              차시를 불러오지 못했어요. 새로고침해 주세요.
            </p>
          ) : lessons.isPending ? (
            <p className="text-muted-foreground">불러오는 중…</p>
          ) : lesson ? (
            <LessonDetail
              classroom={classroom}
              lesson={lesson}
              view={query.view}
              student={query.student}
              onView={(view, student) =>
                go({ tab: "lessons", lesson: lesson.lessonNumber, view, student })
              }
              onBack={() => go({ tab: "lessons" })}
            />
          ) : (
            <LessonsTab
              classroom={classroom}
              lessons={lessonList}
              onView={(lessonNumber) => go({ tab: "lessons", lesson: lessonNumber })}
            />
          )}
        </AppTabsContent>

        <AppTabsContent value="students" className="grid gap-gap">
          {query.student != null ? (
            <StudentPanel
              classroom={classroom}
              membershipId={query.student}
              lessons={lessonList}
              lessonNumber={query.lesson}
              onLesson={(lessonNumber) =>
                go({ tab: "students", student: query.student, lesson: lessonNumber })
              }
              onBack={() => go({ tab: "students" })}
            />
          ) : (
            <StudentsTab
              classroom={classroom}
              onOpen={(membershipId) => go({ tab: "students", student: membershipId })}
            />
          )}
        </AppTabsContent>

        <AppTabsContent value="scores" className="grid gap-gap">
          <ScoresTab
            classroom={classroom}
            courseLabel={course}
            lessons={lessonList}
            onStudents={(lessonNumber) =>
              go({ tab: "lessons", lesson: lessonNumber, view: "students" })
            }
          />
        </AppTabsContent>
      </AppTabs>

      <ConfirmDelete
        open={deleting}
        onOpenChange={() => setDeleting(false)}
        title={`${name}을 지울까요?`}
        losses={losses({ count: classroom.studentCount ?? 0, label: "학생", unit: "명" })}
        busy={busy}
        onConfirm={() => {
          setDeleting(false);
          // 지운 반의 화면을 다시 부르면 404가 난다. 낡았다고만 표시하고 학급 관리로 간다.
          void run(() => deleteClassroom(classroomId), { refetch: "none" }).then((ok) => {
            if (ok) router.push("/teacher");
          });
        }}
      />
    </TeacherShell>
  );
}
