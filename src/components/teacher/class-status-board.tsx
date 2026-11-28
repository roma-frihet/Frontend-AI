// 차시를 반마다 어디까지 했는지 — 진행 중 / 열기 전 / 마감 세 칸으로 나눠 보여 준다.
// 반 이름을 누르면 그 반의 차시 상세로 간다.
//
// 잠시 닫은 반(CLOSED)은 아직 마감하지 않았으므로 "진행 중" 칸에 두고 이름 옆에 "닫힘"을 붙인다.

import Link from "next/link";

import { Callout, Chip } from "@/components/surface";
import { classroomHref } from "@/components/teacher/classroom/use-classroom-query";
import { STATUS_LABEL, STATUS_TONE, type LessonStatus } from "@/components/teacher/lesson-status";
import type { LessonResponseClassroomStatus } from "@/api/generated/model";

const COLUMNS: { status: LessonStatus; includes: LessonStatus[]; empty: string }[] = [
  { status: "OPEN", includes: ["OPEN", "CLOSED"], empty: "진행 중인 반이 없어요" },
  { status: "PLANNED", includes: ["PLANNED"], empty: "모두 열었어요" },
  { status: "FINISHED", includes: ["FINISHED"], empty: "아직 마감한 반이 없어요" },
];

export function ClassStatusBoard({
  classrooms,
  lessonNumber,
}: {
  classrooms: LessonResponseClassroomStatus[];
  lessonNumber: number;
}) {
  const statusOf = (room: LessonResponseClassroomStatus) => (room.status ?? "PLANNED") as LessonStatus;
  const sorted = [...classrooms].sort((a, b) => (a.classNo ?? 0) - (b.classNo ?? 0));

  return (
    <section aria-label="반별 상태" className="grid gap-3 sm:grid-cols-3">
      {COLUMNS.map((column) => {
        const rooms = sorted.filter((room) => column.includes.includes(statusOf(room)));
        return (
          <Callout key={column.status} tone="outline" className="content-start gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <Chip tone={STATUS_TONE[column.status]}>{STATUS_LABEL[column.status]}</Chip>
              <span className="text-sm text-muted-foreground tabular-nums">{rooms.length}개 반</span>
            </div>
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">{column.empty}</p>
            ) : (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {rooms.map((room) => (
                  <li key={room.classroomId}>
                    <Link
                      href={classroomHref(room.classroomId ?? 0, { tab: "lessons", lesson: lessonNumber })}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-bold transition-colors hover:border-primary"
                    >
                      {room.classNo}반
                      {statusOf(room) === "CLOSED" ? (
                        <span className="font-medium text-muted-foreground">닫힘</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Callout>
        );
      })}
    </section>
  );
}
