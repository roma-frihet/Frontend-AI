// 교사 화면의 표 껍데기. 카드와 칩은 @/components/surface에 있다.

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
