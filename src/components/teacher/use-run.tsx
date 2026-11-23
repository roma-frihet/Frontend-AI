"use client";

// 교사 화면의 버튼 대부분은 "서버에 한 번 보내고, 관련 목록을 새로 받고, 실패하면 이유를 보여 준다"이다.
// 그 흐름을 한 곳에 둔다. 서버 detail은 사람에게 그대로 보여 줘도 되는 문장이다.
//
// 무엇을 새로 받을지는 고르지 않고 교사 API 응답을 전부 새로 받는다. 정답 하나를 인정하면
// 학생 점수, 반 평균, 문제별 정답률, 학급 관리 카드가 함께 바뀌어서 빠뜨리기 쉽다.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { refreshTeacherData } from "@/components/teacher/use-refresh";
import { ApiError } from "@/lib/api-fetcher";

export function useRun() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * refetch: "none"이면 지금 떠 있는 화면을 다시 부르지 않고 낡았다고만 표시한다.
   * 지운 대상을 보고 있던 화면처럼, 다시 부르면 404가 나는 경우에 쓴다(곧 화면을 떠난다).
   */
  const run = async (
    task: () => Promise<unknown>,
    { refetch = "active" }: { refetch?: "active" | "none" } = {},
  ) => {
    setError(null);
    setBusy(true);
    try {
      await task();
      await refreshTeacherData(queryClient, refetch);
      return true;
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { run, busy, error, setError };
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
  error instanceof ApiError ? error.message : "불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
