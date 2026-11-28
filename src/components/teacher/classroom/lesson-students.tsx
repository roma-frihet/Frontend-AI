"use client";

// 차시 상세 > 학생별 — 왼쪽에서 학생을 고르면 오른쪽에 그 학생의 이 차시 풀이가 나온다.
// 아직 답하지 않은 학생을 먼저 찾아야 하므로 위로 올린다.

import { AnswerTable } from "@/components/teacher/classroom/answer-table";
import { Panel } from "@/components/teacher/panel";
import { useFindClassroomStudents, useFindScores } from "@/api/generated";
import { cn } from "cn";

const PAGE_SIZE = 100;

export function LessonStudents({
  courseId,
  classroomId,
  lessonNumber,
  selected,
  onSelect,
}: {
  courseId: number;
  classroomId: number;
  lessonNumber: number;
  selected: number | null;
  onSelect: (membershipId: number) => void;
}) {
  const students = useFindClassroomStudents(classroomId, {});
  // 한 반 학생은 100명을 넘지 않는다. 미제출은 correctCount가 null이다.
  const scores = useFindScores(courseId, {
    classroomId,
    lessonNumber,
    size: PAGE_SIZE,
  });

  const scoreOf = new Map(
    (scores.data?.data.content ?? []).map((row) => [row.membershipId, row]),
  );
  const list = [...(students.data?.data.students ?? [])]
    .map((student) => ({ student, score: scoreOf.get(student.membershipId) }))
    .sort((a, b) => {
      const aMissing = a.score?.correctCount == null ? 0 : 1;
      const bMissing = b.score?.correctCount == null ? 0 : 1;
      return (
        aMissing - bMissing ||
        (a.student.studentNumber ?? "").localeCompare(b.student.studentNumber ?? "")
      );
    });

  const current = selected ?? list[0]?.student.membershipId ?? null;

  if (students.isPending) return <p className="text-muted-foreground">불러오는 중…</p>;

  if (list.length === 0) {
    return (
      <Panel>
        <p className="text-muted-foreground">
          아직 이 반에 학생이 없어요. 수업 코드를 발급해 학생에게 알려 주세요.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-gap lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start">
      <Panel className="gap-1.5 p-3 sm:p-3">
        <span className="px-2 pt-1 text-sm text-muted-foreground">
          응답하지 않은 학생이 위에 있어요
        </span>
        <ul className="m-0 grid max-h-120 list-none gap-1 overflow-y-auto p-0">
          {list.map(({ student, score }) => {
            const on = student.membershipId === current;
            const missing = score?.correctCount == null;
            return (
              <li key={student.membershipId}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(student.membershipId ?? 0)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left transition-colors",
                    on ? "bg-primary-soft text-primary-deep" : "hover:bg-secondary",
                  )}
                >
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {student.studentNumber}
                  </span>
                  <strong className="min-w-0 flex-1 truncate">{student.studentName}</strong>
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      missing ? "font-bold text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {missing ? "응답 안 함" : `${score?.correctCount} / ${score?.questionCount}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        {current != null ? (
          <AnswerTable
            key={current}
            classroomId={classroomId}
            membershipId={current}
            lessonNumber={lessonNumber}
          />
        ) : null}
      </Panel>
    </div>
  );
}
