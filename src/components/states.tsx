"use client";

// 불러오는 중 · 비었음 · 실패 — 데이터가 아직 없을 때의 세 가지 모습.
// 화면마다 문장과 모양을 따로 쓰지 않고 여기 것을 쓴다.

import { TextButton, TextLink } from "@/components/text-action";
import { ApiError } from "@/lib/api-fetcher";

export const LOADING_TEXT = "불러오는 중…";

export function LoadingState({ className }: { className?: string }) {
  return (
    <p role="status" className={className ?? "text-muted-foreground"}>
      {LOADING_TEXT}
    </p>
  );
}

/**
 * 빈 화면. children에는 "무엇을 하면 채워지는지"를 적는다(DESIGN.md 글 원칙).
 * 갈 곳이 있으면 action으로 링크를 함께 둔다.
 */
export function EmptyState({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="grid gap-2">
      <p className="text-muted-foreground">{children}</p>
      {action ? <TextLink href={action.href}>{action.label}</TextLink> : null}
    </div>
  );
}

export function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-sm font-medium text-destructive">
      {error}
    </p>
  ) : null;
}

/** 불러오기 실패를 사람이 읽는 문장으로. 서버 detail이 있으면 그것을 쓴다. */
export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.";

/** 불러오기에 실패했을 때. "불러오는 중"으로 남겨 두면 원인을 알 수 없다. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="grid gap-1">
      <ErrorText error={errorMessage(error)} />
      <TextButton size="sm" onClick={onRetry}>
        다시 불러오기
      </TextButton>
    </div>
  );
}
