"use client";

// 교사 화면은 교사 토큰이 아니면 아예 들어갈 수 없다. 서버가 /api/v1/teacher/**를
// 막지만, 화면도 미리 걸러 주는 편이 낫다.
//
// 로그인 화면은 이 구역 안에 있으므로 가드에서 빼야 한다. 빼지 않으면 서로 돌려보낸다.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { TeacherCourseProvider } from "@/components/teacher/use-teacher-course";
import { useSession } from "@/lib/use-session";

const LOGIN_PATH = "/teacher/login";

export function TeacherGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  const isLoginPage = pathname === LOGIN_PATH;
  const blocked =
    session.status === "signed-out" ||
    (session.status === "signed-in" && !session.isTeacher);

  useEffect(() => {
    if (!isLoginPage && blocked) router.replace(LOGIN_PATH);
  }, [isLoginPage, blocked, router]);

  if (isLoginPage) return <>{children}</>;

  // 권한이 없을 때 children을 떼어 내면 Next가 "렌더되지 않은 구간"으로 보고
  // 네비게이션 검사를 못 한다. 그래서 늘 렌더하고, 보낼 사람만 위에서 보낸다.
  // 권한 없이 뜬 화면의 교사 API 호출은 서버가 401로 막는다.
  return <TeacherCourseProvider>{children}</TeacherCourseProvider>;
}
