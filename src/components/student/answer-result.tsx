// 방금 제출한 문제의 결과. 제출하면 차시 마감을 기다리지 않고 바로 정답과 해설이 내려온다.

import { Check, Clock, X } from "lucide-react";

import { Panel } from "@/components/surface";
import { cn } from "cn";
import type { AttemptResponseLast } from "@/api/generated/model";

export function AnswerResult({ last }: { last: AttemptResponseLast }) {
  const right = last.result === "RIGHT";
  // NONE은 아무 답도 내지 않은 것이다. 틀린 것과 구분해서 보여 준다.
  const none = last.result === "NONE";

  return (
    <Panel
      className={cn(
        right
          ? "border-success bg-success-soft"
          : none
            ? "border-border bg-secondary"
            : "border-destructive bg-destructive-soft",
      )}
    >
      <div className="flex items-center gap-2.5 text-lg font-extrabold">
        {right ? (
          <>
            <Check className="size-6 text-success" aria-hidden />
            <span className="text-success">정답이에요</span>
          </>
        ) : none ? (
          <>
            <Clock className="size-6 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">시간이 끝났어요</span>
          </>
        ) : (
          <>
            <X className="size-6 text-destructive" aria-hidden />
            <span className="text-destructive">오답이에요</span>
          </>
        )}
      </div>

      {last.byTimeout ? (
        <p className="text-sm text-muted-foreground">
          시간이 끝나서 마지막으로 적은 답으로 채점했어요.
        </p>
      ) : null}

      {!right && last.correctAnswer ? (
        <div className="grid gap-1">
          <span className="text-sm font-bold text-muted-foreground">정답</span>
          <p className="font-bold">{last.correctAnswer}</p>
        </div>
      ) : null}

      {last.explanation ? (
        <div className="grid gap-1">
          <span className="text-sm font-bold text-muted-foreground">해설</span>
          <p className="whitespace-pre-wrap">{last.explanation}</p>
        </div>
      ) : null}
    </Panel>
  );
}
