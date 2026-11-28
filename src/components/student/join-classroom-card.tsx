"use client";

// 선생님께 받은 6자리 수업 코드로 반에 연결한다.
//
// 승인 절차는 없다. 코드가 맞으면 바로 연결된다. 코드는 5분 뒤 만료된다.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-field";
import { Panel } from "@/components/surface";
import { getFindMyClassroomsQueryKey, joinClassroom } from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";

const JOIN_CODE_LENGTH = 6;

export function JoinClassroomCard({ onJoined }: { onJoined?: () => void }) {
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await joinClassroom({ joinCode: code });
      await queryClient.invalidateQueries({
        queryKey: getFindMyClassroomsQueryKey(),
      });
      setCode("");
      onJoined?.();
    } catch (caught) {
      // 서버 detail은 학생에게 그대로 보여 줘도 되는 문장이다.
      setError(
        caught instanceof ApiError
          ? caught.message
          : "참여하지 못했어요. 코드를 다시 확인해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel>
      <span className="inline-grid size-12 place-items-center rounded-lg bg-primary-soft text-primary">
        <KeyRound className="size-6" aria-hidden />
      </span>

      <div className="grid gap-0.5">
        <h2 className="text-lg font-bold">수업 참여하기</h2>
        <p className="text-muted-foreground">
          선생님이 알려 준 6자리 수업 코드를 입력해 주세요.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2.5" onSubmit={onSubmit} noValidate>
        <label className="sr-only" htmlFor="join-code">
          수업 코드
        </label>
        <AppInput
          id="join-code"
          className="w-60 text-center text-2xl font-extrabold tracking-[0.25em] uppercase"
          autoComplete="off"
          maxLength={JOIN_CODE_LENGTH}
          placeholder="예: 7K3QPA"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
        />
        <AppButton
          type="submit"
          disabled={code.length !== JOIN_CODE_LENGTH || submitting}
        >
          {submitting ? "참여하는 중…" : "참여하기"}
        </AppButton>
      </form>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

    </Panel>
  );
}
