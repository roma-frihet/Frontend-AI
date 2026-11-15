// 로그인·회원가입·토큰 발급은 우리 서버가 아니라 Supabase Auth가 한다.
// 서버(Kotlin)에는 여기서 받은 access_token을 Authorization 헤더로 실어 보낸다.
//
// 세션을 쿠키에 담는 @supabase/ssr의 브라우저 클라이언트를 쓴다.
// localStorage 대신 쿠키를 쓰는 이유는 나중에 서버 쪽에서도 세션을 읽을 수 있게 열어 두기 위함이다.
// (쿠키는 httpOnly가 아니다 — 브라우저가 토큰을 읽어 헤더에 붙여야 하기 때문이다.)

import { createBrowserClient } from "@supabase/ssr";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | undefined;

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 필요합니다. .env.local을 확인하세요.",
    );
  }

  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey);

  return client;
};

/** 지금 로그인된 세션의 access_token. 로그인 전이면 null이다. */
export const getAccessToken = async (): Promise<string | null> => {
  const { data } = await getSupabaseClient().auth.getSession();

  return data.session?.access_token ?? null;
};

/** 토큰의 app_metadata.role이 teacher면 교사다. 서버도 같은 값으로 권한을 가른다. */
export const isTeacherSession = (session: Session | null): boolean =>
  session?.user.app_metadata?.role === "teacher";
