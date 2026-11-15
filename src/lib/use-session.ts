"use client";

// 로그인 여부와 역할을 한 군데서 본다.
//
// 교사와 학생을 가르는 것은 토큰의 app_metadata.role이다. 사용자가 바꿀 수 없는 영역이고,
// 서버도 같은 값으로 /api/v1/teacher/** 접근을 막는다.

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient, isTeacherSession } from "@/lib/supabase/client";

type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; isTeacher: boolean; email: string | null };

const toState = (session: Session | null): SessionState =>
  session
    ? {
        status: "signed-in",
        isTeacher: isTeacherSession(session),
        email: session.user.email ?? null,
      }
    : { status: "signed-out" };

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    const supabase = getSupabaseClient();

    // 로그인·로그아웃은 이 훅 바깥에서 일어난다. 한 번만 읽으면 방금 로그인한 사람을
    // 여전히 로그아웃 상태로 보고 되돌려 보내게 된다. 그래서 변화를 구독한다.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setState(toState(session)),
    );

    void supabase.auth
      .getSession()
      .then(({ data }) => setState(toState(data.session)));

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export const signOut = async () => {
  await getSupabaseClient().auth.signOut();
};
