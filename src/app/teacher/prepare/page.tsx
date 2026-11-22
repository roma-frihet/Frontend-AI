// 차시·문제 준비. 반 상세에서 ?lesson=으로 차시를 짚어 들어올 수 있어 Suspense 안에서 그린다.

import { Suspense } from "react";

import { PrepareLessons } from "@/components/teacher/prepare-lessons";

export default function PreparePage() {
  return (
    <Suspense fallback={null}>
      <PrepareLessons />
    </Suspense>
  );
}
