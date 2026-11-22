"use client";

// 교사 화면을 언제 새로 받을지.
//
// 실시간일 필요는 없다. 대신 다시 볼 때는 최신이어야 한다.
//   - 브라우저 탭이나 창으로 돌아올 때(예약 마감, 학생 제출처럼 그사이 바뀐 것)
//   - 메뉴나 반 상세의 탭·차시·보기 방식을 옮길 때
// 계속 받아 오는 것은 수업 중 화면(3초)뿐이다.
//
// 무엇을 받을지는 고르지 않고 지금 화면에 떠 있는 교사 API를 전부 다시 부른다.
// 떠 있지 않은 것은 낡았다고 표시만 해 두고, 다음에 그 화면을 열 때 받는다.

import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

const TEACHER_API = "/api/v1/teacher";
/** 창 포커스와 탭 보이기가 한꺼번에 오므로 짧은 간격의 두 번째 요청은 버린다. */
const FOCUS_GAP_MS = 2000;

export const refreshTeacherData = (
  queryClient: QueryClient,
  refetchType: "active" | "none" = "active",
) =>
  queryClient.invalidateQueries({
    refetchType,
    predicate: (query) =>
      typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith(TEACHER_API),
  });

/** 브라우저 탭이나 창으로 돌아오면 새로 받는다. 교사 구역 레이아웃에서 한 번만 건다. */
export function useRefreshOnFocus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let last = 0;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - last < FOCUS_GAP_MS) return;
      last = now;
      void refreshTeacherData(queryClient);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [queryClient]);
}

/** key가 바뀌면(화면을 옮기면) 새로 받는다. 처음 그릴 때는 막 받은 참이라 건너뛴다. */
export function useRefreshOnChange(key: string) {
  const queryClient = useQueryClient();
  const previous = useRef(key);

  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    void refreshTeacherData(queryClient);
  }, [key, queryClient]);
}
