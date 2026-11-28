// 차시 이름 — "3차시 광합성". 번호와 제목을 가운뎃점(·)으로 잇지 않고 색으로 나눈다.

import { cn } from "cn";

/** 글자만 필요한 곳(선택 칸 항목, aria-label 등). */
export const lessonLabel = (number?: number | null, title?: string | null) =>
  [number != null ? `${number}차시` : null, title || null].filter(Boolean).join(" ");

export function LessonName({
  number,
  title,
  className,
}: {
  number?: number | null;
  title?: string | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      {number != null ? <span className="text-muted-foreground">{number}차시</span> : null}
      {title ? <span>{title}</span> : null}
    </span>
  );
}
