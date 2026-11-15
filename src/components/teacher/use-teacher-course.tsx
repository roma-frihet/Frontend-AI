"use client";

// 교사가 고른 담당 수업(학년+과목)을 교사 화면 전체가 함께 본다.
// 사이드바에서 바꾸면 본문도 같이 따라가야 해서 컨텍스트로 둔다.
//
// 어느 수업을 보고 있었는지는 다시 들어와도 유지한다.

import { createContext, useCallback, useContext, useState } from "react";

import type { TeacherResponseCourse } from "@/api/generated/model";

const STORAGE_KEY = "roma-frihet:teacher-course-id";

const read = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

const TeacherCourseContext = createContext<{
  courseId: string;
  setCourseId: (id: string) => void;
} | null>(null);

export function TeacherCourseProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState(read);

  const setCourseId = useCallback((id: string) => {
    setStored(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // 저장이 막힌 환경에서는 이번 방문 동안만 기억한다.
    }
  }, []);

  return (
    <TeacherCourseContext.Provider value={{ courseId: stored, setCourseId }}>
      {children}
    </TeacherCourseContext.Provider>
  );
}

/**
 * 고른 수업. 아직 고르지 않았거나 지워진 수업이면 첫 수업으로 떨어진다.
 * 수업이 하나도 없으면 빈 문자열이다.
 */
export function useTeacherCourse(courses: TeacherResponseCourse[] = []) {
  const context = useContext(TeacherCourseContext);
  if (!context) {
    throw new Error("TeacherCourseProvider 안에서만 쓸 수 있습니다.");
  }

  const known = courses.some((course) => String(course.id) === context.courseId);
  const courseId = known ? context.courseId : String(courses[0]?.id ?? "");

  return { ...context, courseId };
}
