// 반 상세. 무엇을 보고 있는지(탭, 차시, 보기 방식)는 URL 쿼리에 있다.
// 쿼리를 읽는 화면이라 Suspense 안에서 그린다.

import { Suspense } from "react";

import { ClassroomDetail } from "@/components/teacher/classroom/classroom-detail";

export default function ClassroomPage({
  params,
}: PageProps<"/teacher/classrooms/[classroomId]">) {
  return (
    <Suspense fallback={null}>
      <ClassroomDetail params={params} />
    </Suspense>
  );
}
