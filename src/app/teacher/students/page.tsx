"use client";

// 학생 관리 — 반을 고르고, 코드로 학생을 모으고, 한 명씩 들여다본다.
//
// membershipId와 학생은 다르다. 교사 API에서 학생을 가리킬 때는 그 반에 속한
// 기록의 id를 쓴다. 같은 학생이 다른 반에 있으면 다른 값이다.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { AppInput } from "@/components/app-field";
import { AppSelect } from "@/components/app-select";
import { JoinCodeCard } from "@/components/teacher/join-code-card";
import { StudentDetail } from "@/components/teacher/student-detail";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useTeacherCourse } from "@/components/teacher/use-teacher-course";
import { Card } from "@/components/ui/card";
import {
  getFindClassroomStudentDetailQueryKey,
  getFindClassroomStudentsQueryKey,
  getFindClassroomsQueryKey,
  useFindClassroomStudents,
  useFindClassrooms,
  useFindMyPage,
} from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";
import { cn } from "cn";

const STATUS_TAG = {
  SCORE_DROPPED: { label: "정답률 하락", tone: "bg-warning-soft text-warning" },
  NOT_RESPONDED: { label: "미응답", tone: "bg-destructive-soft text-destructive" },
} as const;

export default function TeacherStudentsPage() {
  const queryClient = useQueryClient();
  const mypage = useFindMyPage();
  const { courseId } = useTeacherCourse(mypage.data?.data.courses ?? []);

  const classroomsQuery = useFindClassrooms();
  // 반은 수업에 속한다. 사이드바에서 고른 수업의 반만 보여 준다.
  const classrooms = (classroomsQuery.data?.data ?? []).filter(
    (classroom) => String(classroom.courseId) === courseId,
  );

  const [selected, setSelected] = useState("");
  const [keyword, setKeyword] = useState("");
  const [openMembershipId, setOpenMembershipId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const classroomId = selected || String(classrooms[0]?.id ?? "");
  const classroom = classrooms.find((item) => String(item.id) === classroomId);

  const students = useFindClassroomStudents(
    Number(classroomId),
    { keyword },
    { query: { enabled: Boolean(classroomId) } },
  );
  const overview = students.data?.data;
  const studentList = overview?.students ?? [];

  const run = (task: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    void (async () => {
      try {
        await task();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getFindClassroomsQueryKey() }),
          queryClient.invalidateQueries({
            queryKey: getFindClassroomStudentsQueryKey(Number(classroomId), { keyword }),
          }),
          openMembershipId != null
            ? queryClient.invalidateQueries({
                queryKey: getFindClassroomStudentDetailQueryKey(
                  Number(classroomId),
                  openMembershipId,
                ),
              })
            : Promise.resolve(),
        ]);
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  if (!courseId || classrooms.length === 0) {
    return (
      <TeacherShell title="학생 관리">
        <Card className="rounded-lg border border-border p-6 shadow-card ring-0">
          <p className="text-muted-foreground">
            먼저 마이페이지에서 수업과 반을 만들어 주세요.
          </p>
        </Card>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell title="학생 관리">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AppSelect
          items={classrooms.map((item) => ({
            value: String(item.id),
            label: `${item.classNo}반 · 학생 ${item.studentCount ?? 0}명`,
          }))}
          value={classroomId}
          onValueChange={(value) => {
            setSelected(value);
            setOpenMembershipId(null);
          }}
          placeholder="반 선택"
          className="w-60"
        />
      </div>

      {openMembershipId != null ? (
        <StudentDetail
          classroomId={Number(classroomId)}
          membershipId={openMembershipId}
          busy={busy}
          onRun={run}
          onBack={() => setOpenMembershipId(null)}
        />
      ) : (
        <>
          {classroom ? (
            <JoinCodeCard classroom={classroom} busy={busy} onRun={run} />
          ) : null}

          <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">학생 {studentList.length}명</h2>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <AppInput
                  type="search"
                  className="w-60 pl-10"
                  placeholder="이름이나 학번으로 찾기"
                  aria-label="학생 검색"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
            </div>

            {students.isPending ? (
              <p className="text-muted-foreground">불러오는 중…</p>
            ) : studentList.length === 0 ? (
              <p className="text-muted-foreground">
                아직 연결된 학생이 없습니다. 위에서 코드를 발급해 알려 주세요.
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-2 p-0">
                {studentList.map((student) => {
                  const tag = student.status
                    ? STATUS_TAG[student.status as keyof typeof STATUS_TAG]
                    : undefined;

                  return (
                    <li key={student.membershipId}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMembershipId(student.membershipId ?? null)
                        }
                        className="flex w-full flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3 text-left transition-colors hover:border-muted-foreground"
                      >
                        <span className="font-bold">{student.studentName}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {student.studentNumber}
                        </span>
                        {tag ? (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-sm font-bold",
                              tag.tone,
                            )}
                          >
                            {tag.label}
                          </span>
                        ) : null}
                        <span className="ml-auto text-sm font-medium tabular-nums">
                          {student.totalCorrectCount ?? 0} /{" "}
                          {student.totalQuestionCount ?? 0}문제
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </TeacherShell>
  );
}
