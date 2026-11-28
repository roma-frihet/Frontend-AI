"use client";

// 반 상세에서 지금 무엇을 보고 있는지는 URL 쿼리에 둔다.
//
//   /teacher/classrooms/12?tab=lessons&lesson=3&view=questions
//
// 수업 중 화면은 별도 경로로 열고 닫을 때 router.back()으로 돌아온다. 그때 탭·차시·보기 방식이
// 그대로 살아 있어야 열기 전에 보던 차시 상세로 돌아온다. 화면 상태로 들고 있으면 사라진다.

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toId } from "@/lib/id";

export type ClassroomTab = "lessons" | "students" | "scores";
export type LessonView = "questions" | "students" | "compare";

const TABS: ClassroomTab[] = ["lessons", "students", "scores"];
const VIEWS: LessonView[] = ["questions", "students", "compare"];

export type ClassroomQuery = {
  tab: ClassroomTab;
  lesson: number | null;
  view: LessonView;
  student: number | null;
};

// 차시 번호는 1부터 센다. 학생(membershipId)은 서버 ID라 음수·0도 있다(src/lib/id.ts).
const toLessonNumber = (value: string | null) => {
  const n = Number(value);
  return value && Number.isInteger(n) && n > 0 ? n : null;
};

export const classroomHref = (classroomId: number, query: Partial<ClassroomQuery>) => {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "lessons") params.set("tab", query.tab);
  if (query.tab === "lessons" || !query.tab) {
    if (query.lesson) params.set("lesson", String(query.lesson));
    if (query.lesson && query.view && query.view !== "questions") params.set("view", query.view);
  } else if (query.lesson) {
    params.set("lesson", String(query.lesson));
  }
  if (query.student != null) params.set("student", String(query.student));
  const search = params.toString();
  return `/teacher/classrooms/${classroomId}${search ? `?${search}` : ""}`;
};

export function useClassroomQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") as ClassroomTab | null;
  const viewParam = searchParams.get("view") as LessonView | null;

  const query: ClassroomQuery = {
    tab: tabParam && TABS.includes(tabParam) ? tabParam : "lessons",
    lesson: toLessonNumber(searchParams.get("lesson")),
    view: viewParam && VIEWS.includes(viewParam) ? viewParam : "questions",
    student: toId(searchParams.get("student")),
  };

  /** 바꾼 것만 넘긴다. 뒤로 가기로 직전 화면에 돌아갈 수 있게 기록을 남긴다. */
  const go = (next: Partial<ClassroomQuery>) => {
    const classroomId = Number(pathname.split("/")[3]);
    router.push(classroomHref(classroomId, next), { scroll: false });
  };

  return { query, go };
}
