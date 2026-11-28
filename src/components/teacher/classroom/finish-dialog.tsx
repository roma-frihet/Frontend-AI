"use client";

// 마감은 되돌릴 수 없다. 마감해야 학생이 정답과 해설을 본다. 그래서 한 번 더 묻는다.

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
import { finishLesson } from "@/api/generated";

export function FinishDialog({
  classroomId,
  lessonNumber,
  label,
  busy,
  onClose,
  onRun,
}: {
  classroomId: number;
  /** null이면 닫혀 있다. */
  lessonNumber: number | null;
  label: string;
  busy: boolean;
  onClose: () => void;
  onRun: (task: () => Promise<unknown>) => void;
}) {
  return (
    <Dialog open={lessonNumber != null} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}를 마감할까요?</DialogTitle>
          <DialogDescription>
            마감하면 학생이 정답과 해설을 볼 수 있어요. 마감한 뒤에는 다시 열 수 없어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<AppButton variant="outline">취소</AppButton>} />
          <AppButton
            className="bg-destructive hover:bg-destructive/90"
            disabled={busy}
            onClick={() => {
              const number = lessonNumber ?? 0;
              onClose();
              onRun(() => finishLesson(classroomId, number));
            }}
          >
            마감하기
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
