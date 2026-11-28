"use client";

// 학생 상세 — 차시별 점수와, 차시를 골라 문제별 풀이를 본다. 여기서 정답을 인정한다.
//
// 비밀번호 초기화 — 임시 비밀번호가 응답에 한 번만 내려온다. 다시 볼 수 없으므로
// 교사가 받아 적을 수 있게 크게 보여 준다.

import { useRef, useState } from "react";
import { ChevronLeft, KeyRound, UserMinus } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AnswerTable } from "@/components/teacher/classroom/answer-table";
import { statusIn } from "@/components/teacher/classroom/lessons-tab";
import {
  STATUS_LABEL,
  STATUS_TONE,
  type LessonStatus,
} from "@/components/teacher/lesson-status";
import { TableBox, td, th } from "@/components/teacher/panel";
import { useRun } from "@/components/teacher/use-run";
import { errorMessage, ErrorText, LoadingState } from "@/components/states";
import { Callout, Chip, Panel } from "@/components/surface";
import { TextButton } from "@/components/text-action";
import { LessonName } from "@/components/lesson-name";
import {
  removeClassroomStudent,
  resetStudentPassword,
  useFindClassroomStudentDetail,
} from "@/api/generated";
import type {
  ClassroomResponseResult,
  LessonResponseResult,
} from "@/api/generated/model";
import { cn } from "cn";

export function TemporaryPassword({ name, value }: { name: string; value: string }) {
  return (
    <Callout tone="warning" className="gap-2 px-5 py-4">
      <h3 className="font-bold">{name} 학생의 임시 비밀번호</h3>
      <p className="text-3xl font-extrabold tracking-wide tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">
        지금 학생에게 알려 주세요. 이 화면을 벗어나면 다시 볼 수 없어요.
      </p>
    </Callout>
  );
}

export function StudentPanel({
  classroom,
  membershipId,
  lessons,
  lessonNumber,
  onLesson,
  onBack,
}: {
  classroom: ClassroomResponseResult;
  membershipId: number;
  lessons: LessonResponseResult[];
  lessonNumber: number | null;
  onLesson: (lessonNumber: number) => void;
  onBack: () => void;
}) {
  const classroomId = classroom.id ?? 0;
  const detail = useFindClassroomStudentDetail(classroomId, membershipId);
  const data = detail.data?.data;
  const { run, busy, error } = useRun();
  const [password, setPassword] = useState<string | null>(null);
  const answersRef = useRef<HTMLDivElement>(null);

  // 풀이는 점수 표 아래에 있어 눌러도 화면이 그대로면 아무 일도 안 한 것처럼 보인다.
  // 고른 차시로 바꾸고 풀이가 있는 곳으로 내려 준다.
  const showAnswers = (number: number) => {
    onLesson(number);
    requestAnimationFrame(() =>
      answersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const scores = data?.scores ?? [];
  const titleOf = new Map(lessons.map((lesson) => [lesson.lessonNumber, lesson]));
  // 고른 차시가 없으면 가장 최근 차시의 풀이를 보여 준다.
  const shown = lessonNumber ?? data?.latestLessonNumber ?? scores.at(-1)?.lessonNumber ?? null;

  return (
    <>
      <TextButton size="sm" onClick={onBack}>
        <ChevronLeft className="size-4" aria-hidden />
        학생 목록
      </TextButton>

      {detail.isPending ? (
        <LoadingState />
      ) : detail.isError ? (
        <ErrorText error={errorMessage(detail.error)} />
      ) : (
        <>
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-0.5">
                <h2 className="text-xl font-extrabold">
                  {data?.studentNumber} {data?.studentName}
                </h2>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {classroom.classNo}반, 지금까지 {data?.totalCorrectCount ?? 0} /{" "}
                  {data?.totalQuestionCount ?? 0}문제 맞혔어요
                </span>
              </div>
              <span className="flex flex-wrap gap-2">
                <AppButton
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const { data: reset } = await resetStudentPassword(
                        classroomId,
                        membershipId,
                      );
                      setPassword(reset.temporaryPassword ?? null);
                    })
                  }
                >
                  <KeyRound className="size-4" aria-hidden />
                  비밀번호 초기화
                </AppButton>
                <AppButton
                  variant="outline"
                  className="text-destructive hover:bg-destructive-soft"
                  disabled={busy}
                  onClick={() =>
                    // 내보낸 학생의 상세를 다시 부르면 404가 난다. 낡았다고만 표시하고 목록으로 간다.
                    void run(() => removeClassroomStudent(classroomId, membershipId), {
                      refetch: "none",
                    }).then((ok) => {
                      if (ok) onBack();
                    })
                  }
                >
                  <UserMinus className="size-4" aria-hidden />
                  반에서 내보내기
                </AppButton>
              </span>
            </div>
            <ErrorText error={error} />
          </Panel>

          {password ? (
            <TemporaryPassword name={data?.studentName ?? ""} value={password} />
          ) : null}

          <Panel>
            <div className="grid gap-0.5">
              <h3 className="text-lg font-bold">차시별 점수</h3>
              <span className="text-sm text-muted-foreground">
                차시를 누르면 아래에 문제별 풀이가 나와요
              </span>
            </div>
            {scores.length === 0 ? (
              <p className="text-muted-foreground">
                아직 연 차시가 없어요. 차시를 열면 여기에 점수가 쌓여요.
              </p>
            ) : (
              <TableBox label="차시별 점수">
                <thead>
                  <tr>
                    <th scope="col" className={th}>차시</th>
                    <th scope="col" className={th}>맞힌 문제</th>
                    <th scope="col" className={th}>반 평균</th>
                    <th scope="col" className={th}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score) => {
                    const lesson = titleOf.get(score.lessonNumber);
                    const status = (lesson ? statusIn(lesson, classroomId)?.status : undefined) as
                      | LessonStatus
                      | undefined;
                    const on = score.lessonNumber === shown;
                    return (
                      // 줄 어디를 눌러도 그 차시의 풀이를 연다. 키보드로는 차시 이름 버튼으로 고른다.
                      // 줄마다 버튼이 있다 없다 하면 높이가 달라져 누를 때마다 표가 출렁인다.
                      <tr
                        key={score.lessonNumber}
                        onClick={() => showAnswers(score.lessonNumber ?? 0)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          on ? "bg-primary-soft" : "hover:bg-secondary",
                        )}
                      >
                        <td className={td}>
                          <button
                            type="button"
                            aria-current={on ? "true" : undefined}
                            onClick={(event) => {
                              event.stopPropagation();
                              showAnswers(score.lessonNumber ?? 0);
                            }}
                            className={cn("text-left", on ? "font-bold text-primary-deep" : "hover:underline")}
                          >
                            <LessonName number={score.lessonNumber} title={lesson?.title} />
                          </button>
                        </td>
                        <td className={`${td} font-bold tabular-nums`}>
                          {score.correctCount == null
                            ? "응답 안 함"
                            : `${score.correctCount} / ${score.questionCount}`}
                        </td>
                        <td className={`${td} text-accent-deep tabular-nums`}>
                          {score.classAverageCorrect == null
                            ? "–"
                            : `${score.classAverageCorrect.toFixed(1)} / ${score.questionCount}`}
                        </td>
                        <td className={td}>
                          {status ? (
                            <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableBox>
            )}
          </Panel>

          {shown != null ? (
            <Panel ref={answersRef} className="scroll-mt-4">
              <AnswerTable
                key={shown}
                classroomId={classroomId}
                membershipId={membershipId}
                lessonNumber={shown}
                heading="문제별 풀이"
              />
            </Panel>
          ) : null}
        </>
      )}
    </>
  );
}
