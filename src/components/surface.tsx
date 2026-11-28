// 화면을 이루는 면(面) — 카드, 안내 상자, 칩.
//
// 곡률·테두리·그림자·안쪽 여백은 여기에서만 정한다. 화면에서 `rounded-*`, `shadow-card`,
// `p-*`를 직접 조합해 카드를 만들지 않는다. 같은 모양이 화면마다 조금씩 달라진다.
//
//   카드        rounded-lg  (Panel, panelClass)
//   안내 상자   rounded-md  (Callout)
//   칩          rounded-full (Chip)

import { cn } from "cn";

type PanelSize = "sm" | "md" | "lg";

const PANEL_PADDING: Record<PanelSize, string> = {
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

/**
 * 카드 모양 클래스. Link나 button처럼 Panel로 감쌀 수 없는 요소를 카드로 만들 때 쓴다.
 * interactive면 누를 수 있는 카드라 테두리가 반응한다.
 */
export const panelClass = ({
  size = "md",
  interactive = false,
}: { size?: PanelSize; interactive?: boolean } = {}) =>
  cn(
    "grid gap-4 rounded-lg border border-border bg-card text-card-foreground shadow-card",
    PANEL_PADDING[size],
    interactive && "text-left transition-colors hover:border-primary",
  );

type PanelProps = React.ComponentProps<"div"> & {
  size?: PanelSize;
  as?: "div" | "section" | "li" | "article";
};

/** 카드 한 장. 화면의 모든 카드는 이것으로 만든다. */
export function Panel({ size = "md", as: Tag = "div", className, ...props }: PanelProps) {
  return <Tag className={cn(panelClass({ size }), className)} {...(props as object)} />;
}

const CALLOUT_TONE = {
  primary: "bg-primary-soft",
  success: "bg-success-soft",
  warning: "border border-warning bg-warning-soft",
  danger: "bg-destructive-soft text-destructive",
  neutral: "bg-secondary",
} as const;

/** 카드 안팎에 놓는 옅은 색 안내 상자 — 요약, 완료 알림, 꼭 알아야 할 정보. */
export function Callout({
  tone = "primary",
  className,
  ...props
}: React.ComponentProps<"div"> & { tone?: keyof typeof CALLOUT_TONE }) {
  return (
    <div
      className={cn("grid gap-1 rounded-md px-4 py-3", CALLOUT_TONE[tone], className)}
      {...props}
    />
  );
}

/** 상태·분류를 나타내는 작은 알약. 색은 tone으로 넘긴다(예: STATUS_TONE). */
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
