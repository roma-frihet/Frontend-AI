// 수업 중 화면 — 칠판에 띄우는 발표용 화면이라 사이드바 없이 그린다.
// 어느 차시인지는 ?lesson= 쿼리에 있다.

import { Suspense } from "react";

import { LiveBoard } from "@/components/teacher/classroom/live-board";

export default function LivePage({
  params,
}: PageProps<"/teacher/classrooms/[classroomId]/live">) {
  return (
    <Suspense fallback={null}>
      <LiveBoard params={params} />
    </Suspense>
  );
}
