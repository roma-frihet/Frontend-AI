// 문제 하나의 채점 결과 뱃지.
// NONE은 "아무 답도 내지 않음"이다. 틀린 것과 구분해서 보여 준다.

import { cn } from "cn";

type Result = "RIGHT" | "WRONG" | "NONE";

const LABEL: Record<Result, string> = {
  RIGHT: "정답",
  WRONG: "오답",
  NONE: "미응답",
};

const TONE: Record<Result, string> = {
  RIGHT: "bg-success-soft text-success",
  WRONG: "bg-destructive-soft text-destructive",
  NONE: "bg-secondary text-muted-foreground",
};

export function ResultBadge({
  result,
  className,
}: {
  result?: Result;
  className?: string;
}) {
  if (!result) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        TONE[result],
        className,
      )}
    >
      {LABEL[result]}
    </span>
  );
}
