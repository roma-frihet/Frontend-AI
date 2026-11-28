"use client";

// 차시 상세 > 반 비교 — 같은 차시를 연 다른 반과 문제별 정답률을 나란히 본다.
// 한 반만 유난히 낮은 문제는 그 반에서 다시 짚어 볼 문제다.

import { LOW_RATE, percent } from "@/components/teacher/lesson-status";
import { Panel, TableBox, td, th } from "@/components/teacher/panel";
import { useFindQuestionStats } from "@/api/generated";
import { cn } from "cn";

export function ClassCompare({
  courseId,
  courseLabel,
  lessonNumber,
  classroomId,
}: {
  courseId: number;
  courseLabel: string;
  lessonNumber: number;
  classroomId: number;
}) {
  const query = useFindQuestionStats(courseId, lessonNumber);
  const rooms = [...(query.data?.data ?? [])].sort((a, b) => (a.classNo ?? 0) - (b.classNo ?? 0));
  const first = rooms.find((room) => room.questions?.length) ?? rooms[0];
  // 화면 번호는 순서대로 센다. displayOrder는 빈 번호가 생길 수 있다.
  const questions = [...(first?.questions ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );

  const rateOf = (roomIndex: number, questionId?: number) => {
    const room = rooms[roomIndex];
    if (!room || room.status === "PLANNED") return null;
    const question = room.questions?.find((item) => item.questionId === questionId);
    return percent(question?.rightCount ?? 0, room.responseCount ?? 0);
  };

  return (
    <Panel>
      <div className="grid gap-0.5">
        <h3 className="text-lg font-bold">
          반 비교 · {courseLabel} {lessonNumber}차시
        </h3>
        <span className="text-sm text-muted-foreground">
          굵은 칸이 지금 보고 있는 반, 노란 칸은 정답률 50% 미만입니다
        </span>
      </div>

      {query.isPending ? (
        <p className="text-muted-foreground">불러오는 중…</p>
      ) : rooms.length < 2 ? (
        <p className="text-muted-foreground">
          같은 학년·과목의 반이 둘 이상이면 반끼리 비교할 수 있습니다.
        </p>
      ) : (
        <TableBox label="반별 문제 정답률">
          <thead>
            <tr>
              <th scope="col" className={th}>문제</th>
              {rooms.map((room) => (
                <th
                  key={room.classroomId}
                  scope="col"
                  className={cn(th, "text-right", room.classroomId === classroomId && "text-primary-deep")}
                >
                  {room.classNo}반
                  {room.status === "PLANNED" ? " (열기 전)" : ` · ${room.responseCount ?? 0}명`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((question, index) => (
              <tr key={question.questionId}>
                <td className={`${td} min-w-56`}>
                  <strong className="mr-2 text-muted-foreground tabular-nums">
                    {index + 1}
                  </strong>
                  {question.content ?? "그림 문제"}
                </td>
                {rooms.map((room, index) => {
                  const rate = rateOf(index, question.questionId);
                  const mine = room.classroomId === classroomId;
                  return (
                    <td
                      key={room.classroomId}
                      className={cn(
                        td,
                        "text-right tabular-nums",
                        rate != null && rate < LOW_RATE * 100 && "bg-warning-soft",
                        mine && "font-extrabold text-primary-deep",
                      )}
                    >
                      {rate == null ? "–" : `${rate}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </TableBox>
      )}
    </Panel>
  );
}
