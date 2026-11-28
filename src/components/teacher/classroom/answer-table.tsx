"use client";

// 한 학생이 한 차시에서 문제마다 무엇을 골랐고 썼는지, 그리고 교사가 정답으로 인정하는 곳.
//
// 주관식은 표현이 달라도 맞는 답이 있다. 인정하면 점수와 반 평균에 바로 반영된다.
// 서버는 원래 결과를 이력으로 남기지만 되돌릴 값은 알려 주지 않는다. 그래서 교사가 인정한 답을
// 취소하면 오답으로 둔다(일괄 인정 취소와 같다).

import Image from "next/image";

import { AppButton } from "@/components/app-button";
import { TableBox, td, th } from "@/components/teacher/panel";
import { useRun } from "@/components/teacher/use-run";
import { errorMessage, ErrorText, LoadingState } from "@/components/states";
import { Chip } from "@/components/surface";
import { overrideAttemptResult, useFindStudentLessonAnswers } from "@/api/generated";
import type { StudentAnswerResponseAnswer } from "@/api/generated/model";

const RESULT = {
  RIGHT: { label: "정답", tone: "bg-success-soft text-success" },
  WRONG: { label: "오답", tone: "bg-destructive-soft text-destructive" },
  NONE: { label: "응답 안 함", tone: "bg-secondary text-muted-foreground" },
  IN_PROGRESS: { label: "푸는 중", tone: "bg-primary-soft text-primary-deep" },
  NOT_STARTED: { label: "시작 전", tone: "bg-secondary text-muted-foreground" },
} as const;

// 보기 번호는 화면에 보인 순서(1부터)로 센다. displayOrder는 중간에 빈 번호가 생길 수 있다.
const optionLabel = (answer: StudentAnswerResponseAnswer, index: number) =>
  `${index + 1}. ${answer.options?.[index]?.content ?? "그림 보기"}`;

const given = (answer: StudentAnswerResponseAnswer) => {
  if (answer.type === "SHORT_ANSWER") return answer.answerText?.trim() || "–";
  const index = answer.options?.findIndex((item) => item.optionId === answer.selectedOptionId) ?? -1;
  return index >= 0 ? optionLabel(answer, index) : "–";
};

const correct = (answer: StudentAnswerResponseAnswer) => {
  if (answer.type === "SHORT_ANSWER") return answer.acceptedAnswers?.join(", ") || "–";
  return (
    answer.options
      ?.map((item, index) => (item.isCorrect ? optionLabel(answer, index) : null))
      .filter(Boolean)
      .join(", ") || "–"
  );
};

export function AnswerTable({
  classroomId,
  membershipId,
  lessonNumber,
  heading,
}: {
  classroomId: number;
  membershipId: number;
  lessonNumber: number;
  /** 제목 앞에 붙일 말. 없으면 학생 이름을 쓴다. */
  heading?: string;
}) {
  const query = useFindStudentLessonAnswers(classroomId, membershipId, lessonNumber);
  const data = query.data?.data;
  const answers = data?.answers ?? [];
  const { run, busy, error } = useRun();

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorText error={errorMessage(query.error)} />;

  const started = answers.some((answer) => answer.result !== "NOT_STARTED");

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <h3 className="text-lg font-bold">
            {heading ?? `${data?.studentNumber} ${data?.studentName}`}
          </h3>
          <span className="text-sm text-muted-foreground">
            {data?.lessonNumber}차시 · {data?.lessonTitle}
          </span>
        </div>
        <p className="flex items-baseline gap-1">
          <b className="text-2xl font-extrabold text-primary-deep tabular-nums">
            {started ? (data?.correctCount ?? 0) : "–"}
          </b>
          <span className="text-muted-foreground">/ {data?.questionCount ?? 0}문제</span>
        </p>
      </div>

      {!started ? (
        <p className="rounded-md bg-secondary px-4 py-6 text-center text-muted-foreground">
          이 차시에 답을 내지 않았어요.
        </p>
      ) : (
        <>
          <TableBox label={`${data?.studentName} ${data?.lessonNumber}차시 풀이`}>
            <thead>
              <tr>
                <th scope="col" className={th}>#</th>
                <th scope="col" className={th}>문제</th>
                <th scope="col" className={th}>학생 답</th>
                <th scope="col" className={th}>정답</th>
                <th scope="col" className={th}>결과</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer) => {
                const result = RESULT[answer.result ?? "NOT_STARTED"];
                const id = answer.attemptAnswerId;
                const canAccept =
                  id != null && (answer.result === "WRONG" || answer.result === "NONE");
                const canCancel =
                  id != null && answer.result === "RIGHT" && answer.isOverridden;

                return (
                  <tr key={answer.questionId}>
                    <td className={`${td} text-muted-foreground tabular-nums`}>
                      {answer.number}
                    </td>
                    <td className={`${td} min-w-48`}>
                      <span className="grid gap-2">
                        {answer.content ?? (answer.imageUrl ? null : "그림 문제")}
                        {answer.imageUrl ? (
                          // 서명된 임시 주소(10분)라 화면을 열 때 받은 것을 그대로 쓴다.
                          <Image
                            src={answer.imageUrl}
                            alt={`${answer.number}번 문제 그림`}
                            width={320}
                            height={180}
                            unoptimized
                            className="h-auto w-40 rounded-md border border-border"
                          />
                        ) : null}
                      </span>
                    </td>
                    <td className={`${td} font-medium`}>{given(answer)}</td>
                    <td className={`${td} text-muted-foreground`}>{correct(answer)}</td>
                    <td className={td}>
                      <span className="flex flex-wrap items-center gap-2">
                        <Chip tone={result.tone}>{result.label}</Chip>
                        {answer.byTimeout ? (
                          <span className="text-sm text-muted-foreground">시간 종료</span>
                        ) : null}
                        {answer.isOverridden ? (
                          <span className="text-sm text-accent-deep">교사 수정</span>
                        ) : null}
                        {canAccept ? (
                          <AppButton
                            variant="outline"
                            className="h-8 px-2.5 text-sm"
                            disabled={busy}
                            onClick={() =>
                              void run(() => overrideAttemptResult(id, { result: "RIGHT" }))
                            }
                          >
                            정답 인정
                          </AppButton>
                        ) : null}
                        {canCancel ? (
                          <AppButton
                            variant="outline"
                            className="h-8 px-2.5 text-sm"
                            disabled={busy}
                            onClick={() =>
                              void run(() => overrideAttemptResult(id, { result: "WRONG" }))
                            }
                          >
                            인정 취소
                          </AppButton>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
          <ErrorText error={error} />
          <p className="text-sm text-muted-foreground">
            표현이 달라도 맞는 답이면 정답으로 인정해 주세요. 점수와 반 평균에 바로 반영돼요.
          </p>
        </>
      )}
    </div>
  );
}
