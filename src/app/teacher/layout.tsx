// 교사 구역의 레이아웃.
//
// 로그인 여부를 브라우저에서 판단하므로, 들어오는 순간 바로 그릴 수 있는 화면이 없다.
// cacheComponents의 instant 검사에서 이 구역을 빼 준다. (클라이언트 컴포넌트에는
// 쓸 수 없는 설정이라 레이아웃은 서버 컴포넌트로 두고 가드만 따로 뺐다.)

import { TeacherGuard } from "@/components/teacher/teacher-guard";

export const instant = false;

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  return <TeacherGuard>{children}</TeacherGuard>;
}
