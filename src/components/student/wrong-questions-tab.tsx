"use client";

// 틀린 문제 모음.
//
// 마감된 차시의 것만 내려온다. 마감 전 차시의 틀린 문제는 오지 않는다 —
// 마감 전에 정답을 공개하지 않는다는 규칙과 같은 이유다.

import { ResultBadge } from "@/components/student/result-badge";
import { LoadingState } from "@/components/states";
import { Panel } from "@/components/surface";
import { useFindMyWrongQuestions } from "@/api/generated";

export function WrongQuestionsTab({ classroomId }: { classroomId: number }) {
  const wrong = useFindMyWrongQuestions(classroomId);
  const questions = wrong.data?.data ?? [];

  if (wrong.isPending) {
    return <LoadingState />;
  }

  if (questions.length === 0) {
    return (
      <Panel>
        <p className="text-muted-foreground">
          아직 틀린 문제가 없어요. 수업이 끝나면 틀린 문제가 여기에 모여요.
        </p>
      </Panel>
    );
  }

  return (
    <ul className="m-0 grid list-none gap-gap p-0">
      {questions.map((question) => (
        <li key={`${question.lessonNumber}-${question.questionIndex}`}>
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-muted-foreground">
                {question.lessonNumber}차시 · {question.lessonTitle}
              </span>
              <ResultBadge result={question.result} />
            </div>

            <p className="font-bold whitespace-pre-wrap">
              {(question.questionIndex ?? 0) + 1}. {question.content}
            </p>

            {question.correctAnswer ? (
              <div className="grid gap-1">
                <span className="text-sm font-bold text-muted-foreground">정답</span>
                <p className="font-bold text-success">{question.correctAnswer}</p>
              </div>
            ) : null}

            {question.explanation ? (
              <div className="grid gap-1">
                <span className="text-sm font-bold text-muted-foreground">해설</span>
                <p className="whitespace-pre-wrap">{question.explanation}</p>
              </div>
            ) : null}
          </Panel>
        </li>
      ))}
    </ul>
  );
}
