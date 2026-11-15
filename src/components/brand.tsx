// 목업의 .brand — 아이콘 + 서비스명, 필요하면 역할 배지.

import { BookOpen } from "lucide-react";
import { cn } from "cn";

export const SERVICE_NAME = "복습 문제";

export function Brand({
  badge,
  className,
}: {
  /** "학생" / "교사"처럼 지금 보고 있는 쪽을 알려 준다 */
  badge?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-lg font-extrabold text-foreground",
        className,
      )}
    >
      <BookOpen className="size-6.5 text-primary" aria-hidden />
      {SERVICE_NAME}
      {badge ? (
        <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-sm font-bold whitespace-nowrap text-primary-deep">
          {badge}
        </span>
      ) : null}
    </span>
  );
}
