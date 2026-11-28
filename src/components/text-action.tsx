// 글자로 된 동작 — 글자 버튼, 글자 링크, 아이콘 버튼.
// 큰 버튼은 AppButton을 쓴다. 여기 것은 문장 사이나 카드 구석에 놓는 작은 동작이다.

import Link from "next/link";

import { cn } from "cn";

type Tone = "primary" | "muted";
type Size = "sm" | "base";

const textClass = (tone: Tone, size: Size) =>
  cn(
    "inline-flex w-fit items-center gap-1.5 transition-colors disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "text-sm",
    tone === "primary" && "font-bold text-primary-deep hover:underline",
    tone === "muted" && "font-medium text-muted-foreground hover:text-foreground",
  );

type TextProps = { tone?: Tone; size?: Size };

export function TextButton({
  tone = "primary",
  size = "base",
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & TextProps) {
  return <button type={type} className={cn(textClass(tone, size), className)} {...props} />;
}

export function TextLink({
  tone = "primary",
  size = "base",
  className,
  ...props
}: React.ComponentProps<typeof Link> & TextProps) {
  return <Link className={cn(textClass(tone, size), className)} {...props} />;
}

const ICON_TONE = {
  neutral: "hover:bg-primary-soft hover:text-primary-deep",
  danger: "hover:bg-destructive-soft hover:text-destructive",
} as const;

/** 아이콘만 있는 둥근 버튼(수정·삭제 등). 화면에 글자가 없으니 aria-label은 꼭 넘긴다. */
export function IconButton({
  tone = "neutral",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & {
  "aria-label": string;
  tone?: keyof typeof ICON_TONE;
  size?: "md" | "lg";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full text-muted-foreground transition-colors disabled:opacity-50",
        size === "md" ? "size-9" : "size-11",
        ICON_TONE[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * 여러 개 중 하나를 고르는 둥근 버튼(보기 방식, 수업 고르기 등).
 * 묶음은 role="group"과 aria-label을 단 요소로 감싼다.
 */
export function ToggleChip({
  pressed,
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & { pressed: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        "min-h-10 rounded-full border px-4 text-sm font-bold transition-colors",
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
