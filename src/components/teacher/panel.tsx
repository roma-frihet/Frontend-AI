// 교사 화면에서 되풀이되는 작은 조각들 — 카드 한 장, 상태 칩, 표 껍데기.

import { Card } from "@/components/ui/card";
import { cn } from "cn";

export function Panel({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "grid gap-4 rounded-lg border border-border p-5 shadow-card ring-0 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  tone,
  className,
  children,
}: {
  tone: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        tone,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 좁은 화면에서 표는 줄이지 않고 가로로 넘긴다. */
export function TableBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="relative overflow-x-auto rounded-md border border-border"
    >
      <table className="w-full min-w-xl text-left">{children}</table>
    </div>
  );
}

export const th = "bg-secondary px-4 py-2.5 text-sm font-medium text-muted-foreground whitespace-nowrap";
export const td = "border-t border-border px-4 py-3 align-middle";
