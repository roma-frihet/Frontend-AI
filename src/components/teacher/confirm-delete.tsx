"use client";

// 되돌릴 수 없는 삭제 앞에서 한 번 더 묻는다.
//
// "정말 삭제하시겠습니까?"만 띄우면 아무 정보도 주지 않는다. 무엇이 몇 개 사라지는지
// 숫자로 보여 준다. 선생님이 반 번호를 잘못 고른 것을 여기서 알아차릴 수 있어야 한다.
//
// 서버는 기록이 있어도 지운다. 막아 주는 것은 이 확인뿐이다.

import { AppButton } from "@/components/app-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDelete({
  open,
  onOpenChange,
  title,
  losses,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** 함께 사라지는 것들. 비어 있으면 문장을 줄인다. */
  losses: string[];
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {losses.length > 0
              ? `${subject(losses.join(", "))} 함께 사라집니다. 되돌릴 수 없습니다.`
              : "되돌릴 수 없습니다."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<AppButton variant="outline">취소</AppButton>} />
          <AppButton
            className="bg-destructive hover:bg-destructive/90"
            disabled={busy}
            onClick={onConfirm}
          >
            삭제
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 받침이 있으면 true. 과목 이름과 차시 이름이 사용자 입력이라, 문장에 그대로 끼우면
 * "수학를", "학생 1명가"처럼 조사가 틀어진다. 한글이 아닌 글자로 끝나면 판단할 수 없어
 * 받침이 있는 쪽(을/이)으로 둔다.
 */
function hasFinalConsonant(word: string): boolean {
  const last = word.trim().at(-1);
  if (last == null) return true;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return true;
  return (code - 0xac00) % 28 !== 0;
}

/** "수학을", "소인수분해를" */
export function withParticle(word: string): string {
  return `${word}${hasFinalConsonant(word) ? "을" : "를"}`;
}

/** "반 1개가", "학생 1명이" */
function subject(word: string): string {
  return `${word}${hasFinalConsonant(word) ? "이" : "가"}`;
}

/** "반 3개", "학생 68명"처럼 0인 항목은 빼고 문장에 넣을 조각을 만든다. */
export function losses(
  ...parts: { count: number; label: string; unit: string }[]
): string[] {
  return parts
    .filter((part) => part.count > 0)
    .map((part) => `${part.label} ${part.count}${part.unit}`);
}
