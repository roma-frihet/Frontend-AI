"use client";

// 교사 화면의 껍데기 — 왼쪽 사이드바 + 본문.
//
// 담당 수업(학년+과목)을 사이드바에서 고르고, 고른 수업이 아래 화면 전체의 기준이 된다.
// 반·수업 추가처럼 드물게 쓰는 것은 마이페이지로 보낸다.

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FileText, LayoutDashboard, Users } from "lucide-react";

import { AppSelect } from "@/components/app-select";
import { Brand } from "@/components/brand";
import { useFindMyPage } from "@/api/generated";
import { useTeacherCourse } from "@/components/teacher/use-teacher-course";
import { cn } from "cn";

const NAV = [
  { href: "/teacher", label: "대시보드", icon: LayoutDashboard },
  { href: "/teacher/questions", label: "문제 관리", icon: FileText },
  { href: "/teacher/students", label: "학생 관리", icon: Users },
] as const;

export function TeacherShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const mypage = useFindMyPage();
  const profile = mypage.data?.data.profile;
  const courses = mypage.data?.data.courses ?? [];

  const { courseId, setCourseId } = useTeacherCourse(courses);

  return (
    <div className="grid flex-1 grid-cols-[248px_minmax(0,1fr)]">
      <aside
        aria-label="교사 메뉴"
        className="sticky top-0 flex h-screen flex-col gap-6 self-start border-r border-border bg-card p-4 pt-5"
      >
        <Link href="/teacher" className="px-2">
          <Brand badge="교사" />
        </Link>

        {courses.length > 0 ? (
          <label className="grid gap-1.5 px-1">
            <span className="text-sm text-muted-foreground">담당 수업</span>
            <AppSelect
              items={courses.map((course) => ({
                value: String(course.id),
                label: `${course.grade}학년 ${course.subjectName}`,
              }))}
              value={courseId}
              onValueChange={setCourseId}
              placeholder="수업 선택"
              className="font-bold"
            />
          </label>
        ) : null}

        <nav>
          <ul className="m-0 grid list-none gap-1 p-0">
            {NAV.map((item) => {
              const active =
                item.href === "/teacher"
                  ? pathname === "/teacher"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex min-h-11.5 w-full items-center gap-3 rounded-md px-3.5 text-left font-medium transition-colors",
                      active
                        ? "bg-primary-soft font-bold text-primary-deep"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4.5" aria-hidden />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto grid gap-0.5 rounded-lg bg-secondary p-4">
          <p className="text-sm text-muted-foreground">학교</p>
          <p className="font-bold">{profile?.schoolName ?? "–"}</p>
          <Link
            href="/teacher/mypage"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary-deep hover:underline"
          >
            마이페이지
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="min-w-0 px-8">
        <header className="mb-7 flex min-h-19 items-center justify-between gap-4 border-b border-border">
          <h1 className="text-xl font-extrabold">{title}</h1>
          <Link
            href="/teacher/mypage"
            className="flex items-center gap-2.5 font-medium"
          >
            <span className="inline-grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-deep">
              {profile?.name?.slice(0, 1) ?? "선"}
            </span>
            {profile?.name ?? "선생님"}
          </Link>
        </header>

        <div className="grid gap-6 pb-10">{children}</div>
      </div>
    </div>
  );
}
