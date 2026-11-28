"use client";

// 학생 탭 — 이 반 학생 목록. 살펴볼 학생(미응답, 정답률 하락)을 먼저 보여 준다.
//
// membershipId와 학생은 다르다. 교사 API에서 학생을 가리킬 때는 그 반에 속한
// 기록의 id를 쓴다. 같은 학생이 다른 반에 있으면 다른 값이다.

import { useState } from "react";
import { Search } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-field";
import { Chip, Panel, TableBox, td, th } from "@/components/teacher/panel";
import { TemporaryPassword } from "@/components/teacher/classroom/student-panel";
import { ErrorText, useRun } from "@/components/teacher/use-run";
import { resetStudentPassword, useFindClassroomStudents } from "@/api/generated";
import type { ClassroomResponseResult } from "@/api/generated/model";

export const STATUS_TAG = {
  SCORE_DROPPED: { label: "정답률 하락", tone: "bg-warning-soft text-foreground" },
  NOT_RESPONDED: { label: "응답 안 함", tone: "bg-destructive-soft text-destructive" },
} as const;

export function StudentsTab({
  classroom,
  onOpen,
}: {
  classroom: ClassroomResponseResult;
  onOpen: (membershipId: number) => void;
}) {
  const classroomId = classroom.id ?? 0;
  const [keyword, setKeyword] = useState("");
  const students = useFindClassroomStudents(classroomId, { keyword });
  const list = students.data?.data.students ?? [];
  const watch = list.filter((student) => student.status && student.status in STATUS_TAG).length;

  const { run, busy, error } = useRun();
  const [password, setPassword] = useState<{ name: string; value: string } | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <AppInput
            type="search"
            className="w-64 max-w-full bg-card pl-10"
            placeholder="이름이나 학번"
            aria-label="학생 검색"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        {watch > 0 ? (
          <span className="text-sm font-bold">살펴볼 학생 {watch}명</span>
        ) : null}
      </div>

      {password ? (
        <TemporaryPassword name={password.name} value={password.value} />
      ) : null}
      <ErrorText error={error} />

      {students.isPending ? (
        <p className="text-muted-foreground">불러오는 중…</p>
      ) : list.length === 0 ? (
        <Panel>
          <p className="text-muted-foreground">
            {keyword
              ? "찾는 학생이 없어요. 이름이나 학번을 다시 확인해 주세요."
              : "아직 참여한 학생이 없어요. 위에서 수업 코드를 발급해 학생에게 알려 주세요."}
          </p>
        </Panel>
      ) : (
        <TableBox label="학생 목록">
          <thead>
            <tr>
              <th scope="col" className={th}>학번</th>
              <th scope="col" className={th}>이름</th>
              <th scope="col" className={th}>최근 차시</th>
              <th scope="col" className={th}>전체</th>
              <th scope="col" className={th}>상태</th>
              <th scope="col" className={th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {list.map((student) => {
              const tag = student.status
                ? STATUS_TAG[student.status as keyof typeof STATUS_TAG]
                : undefined;
              const latest = student.recentScores?.at(-1);
              return (
                <tr key={student.membershipId}>
                  <td className={`${td} tabular-nums`}>{student.studentNumber}</td>
                  <td className={`${td} font-bold`}>{student.studentName}</td>
                  <td className={`${td} tabular-nums`}>
                    {student.latestCorrectCount == null
                      ? "응답 안 함"
                      : `${student.latestCorrectCount} / ${latest?.questionCount ?? "–"}`}
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {student.totalCorrectCount ?? 0} / {student.totalQuestionCount ?? 0}
                  </td>
                  <td className={td}>
                    {tag ? <Chip tone={tag.tone}>{tag.label}</Chip> : <span className="text-muted-foreground">–</span>}
                  </td>
                  <td className={td}>
                    <span className="flex gap-2">
                      <AppButton
                        variant="outline"
                        className="h-9 px-3"
                        onClick={() => onOpen(student.membershipId ?? 0)}
                      >
                        상세
                      </AppButton>
                      <AppButton
                        variant="outline"
                        className="h-9 px-3"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const { data } = await resetStudentPassword(
                              classroomId,
                              student.membershipId ?? 0,
                            );
                            setPassword({
                              name: student.studentName ?? "",
                              value: data.temporaryPassword ?? "",
                            });
                          })
                        }
                      >
                        비밀번호 초기화
                      </AppButton>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableBox>
      )}
    </>
  );
}
