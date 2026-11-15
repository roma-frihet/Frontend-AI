// 문제 풀기 화면의 껍데기.
//
// cacheComponents가 켜져 있어 라우트는 정적 껍데기를 먼저 내보낸다.
// 실제 내용은 로그인한 학생의 응시 상태라 미리 만들 수 없으므로 Suspense 안에서 받는다.

import { Suspense } from "react";

import { SolveLesson } from "@/components/student/solve-lesson";

export default function SolveLessonPage({
  params,
}: PageProps<"/lessons/[classroomId]/[lessonNumber]">) {
  return (
    <Suspense fallback={null}>
      <SolveLesson params={params} />
    </Suspense>
  );
}
