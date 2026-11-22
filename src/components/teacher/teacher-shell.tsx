"use client";

// 교사 화면의 껍데기 — 왼쪽 사이드바 + 본문.
//
// 교사 화면은 반이 중심이다. 수업 중에는 학급 관리 → 반으로 들어가 열고 마감하고,
// 수업 전에는 차시·문제 준비에서 만든다. 마이페이지에는 내 정보만 둔다.

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FileText, LayoutGrid, UserRound } from "lucide-react";

import { Brand } from "@/components/brand";
import { useFindMyPage } from "@/api/generated";
import { cn } from "cn";

const NAV = [
  {
    href: "/teacher",
    label: "학급 관리",
    icon: LayoutGrid,
    match: (path: string) => path === "/teacher" || path.startsWith("/teacher/classrooms"),
  },
  {
    href: "/teacher/prepare",
    label: "차시·문제 준비",
    icon: FileText,
    match: (path: string) => path.startsWith("/teacher/prepare"),
  },
  {
    href: "/teacher/mypage",
    label: "마이페이지",
    icon: UserRound,
    match: (path: string) => path.startsWith("/teacher/mypage"),
  },
] as const;

export function TeacherShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mypage = useFindMyPage();
  const profile = mypage.data?.data.profile;

  return (
    <div className="grid flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* 좁은 화면에서는 사이드바를 위쪽 띠로 눕히고 메뉴를 쌓는다. */}
      <aside
        aria-label="교사 메뉴"
        className="flex min-w-0 flex-col gap-4 border-b border-border bg-card p-4 lg:sticky lg:top-0 lg:h-screen lg:gap-6 lg:self-start lg:border-r lg:border-b-0 lg:pt-5"
      >
        <Brand badge="교사" href="/teacher" className="px-2" />

        <nav>
          <ul className="m-0 grid list-none gap-1 p-0 sm:grid-cols-3 lg:grid-cols-1">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11.5 w-full items-center gap-3 rounded-md px-3.5 font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-primary-soft font-bold text-primary-deep"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4.5" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto hidden gap-0.5 rounded-lg bg-secondary p-4 lg:grid">
          <p className="text-sm text-muted-foreground">학교</p>
          <p className="font-bold">{profile?.schoolName ?? "–"}</p>
          <p className="text-sm text-muted-foreground">{profile?.name ?? "선생님"}</p>
        </div>
      </aside>

      <main className="min-w-0 px-4 pt-6 pb-10 lg:px-10 lg:pt-8">
        <div className="mx-auto grid max-w-page gap-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid min-w-0 gap-1.5">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
              {description ? (
                <div className="text-muted-foreground">{description}</div>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
