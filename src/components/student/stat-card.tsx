// 목업의 .card.stat — 아이콘 제목 + 큰 숫자 + 진행 막대.

import { Card } from "@/components/ui/card";
import { cn } from "cn";

export function StatCard({
  icon,
  title,
  value,
  unit,
  ratio,
  tone = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit?: string;
  /** 0~1. 없으면 막대를 그리지 않는다 */
  ratio?: number | null;
  /** 연보라는 "반 평균"처럼 내 값과 견주는 값에만 쓴다 */
  tone?: "primary" | "compare";
}) {
  return (
    <Card className="grid content-start gap-3 rounded-lg border border-border p-5 shadow-card ring-0">
      <div
        className={cn(
          "flex items-center gap-2.5 font-bold",
          tone === "primary" ? "text-primary" : "text-accent-deep",
        )}
      >
        {icon}
        <span className="text-foreground">{title}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-1.5">
        <b className="text-3xl leading-tight font-extrabold tracking-tight tabular-nums">
          {value}
        </b>
        {unit ? (
          <span className="text-sm text-muted-foreground">{unit}</span>
        ) : null}
      </div>

      {typeof ratio === "number" ? (
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
          <span
            className={cn(
              "block h-full rounded-full",
              tone === "primary" ? "bg-primary" : "bg-accent-strong",
            )}
            style={{ width: `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%` }}
          />
        </div>
      ) : null}
    </Card>
  );
}
