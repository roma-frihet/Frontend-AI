"use client";

// 교사 로그아웃. 세션을 끊고, 앞 사람의 화면 데이터가 남지 않게 캐시를 비운 뒤 로그인으로 보낸다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { signOut } from "@/lib/use-session";

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  const run = async () => {
    setSigningOut(true);
    try {
      await signOut();
      queryClient.clear();
      router.replace("/teacher/login");
    } finally {
      setSigningOut(false);
    }
  };

  return { signOut: run, signingOut };
}
