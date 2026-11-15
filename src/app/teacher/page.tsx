"use client";

// 교사 대시보드.
//
// 수업이 하나도 없는 상태로 시작하는 것이 정상이다. 빈 화면이 아니라 안내 화면이어야 한다.
// 서버가 setup으로 어디까지 했는지 알려 주므로 그걸로 다음에 할 일을 짚어 준다.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Check, Unlock } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { StatCard } from "@/components/student/stat-card";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useTeacherCourse } from "@/components/teacher/use-teacher-course";
import { Card } from "@/components/ui/card";
import { useFindMyPage, useFindDashboard } from "@/api/generated";
import { cn } from "cn";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const mypage = useFindMyPage();
  const courses = mypage.data?.data.courses ?? [];
  const profile = mypage.data?.data.profile;
  const { courseId } = useTeacherCourse(courses);

  const dashboard = useFindDashboard(Number(courseId), {
    query: { enabled: Boolean(courseId) },
  });
  const data = dashboard.data?.data;
  const setup = data?.setup;

  const steps = [
    { done: setup?.hasClassroom, label: "반 만들기", href: "/teacher/mypage" },
    { done: setup?.hasLesson, label: "차시 추가하기", href: "/teacher/questions" },
    { done: setup?.hasQuestion, label: "문제 넣기", href: "/teacher/questions" },
    { done: setup?.hasOpenedLesson, label: "차시 열기", href: "/teacher/questions" },
  ];
  const remaining = steps.filter((step) => !step.done).length;

  return (
    <TeacherShell title="대시보드">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-0.5">
          <h2 className="text-2xl font-extrabold">
            안녕하세요, {profile?.name ?? "선생님"}
          </h2>
          <p className="text-muted-foreground">
            {courses.length === 0
              ? "먼저 마이페이지에서 담당 수업을 만들어 주세요."
              : "수업이 끝나면 차시를 열어 주세요."}
          </p>
        </div>
        {courses.length > 0 ? (
          <AppButton onClick={() => router.push("/teacher/questions")}>
            <Unlock className="size-4" aria-hidden />
            문제 열기
          </AppButton>
        ) : (
          <AppButton onClick={() => router.push("/teacher/mypage")}>
            수업 만들기
          </AppButton>
        )}
      </div>

      {courses.length === 0 ? (
        <Card className="rounded-lg border border-border p-6 shadow-card ring-0">
          <p className="text-muted-foreground">
            아직 담당 수업이 없습니다. 수업은 학년과 과목으로 만듭니다.
          </p>
        </Card>
      ) : dashboard.isPending ? (
        <p className="text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          {remaining > 0 ? (
            <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <Check className="size-5 text-primary" aria-hidden />
                <h3 className="text-lg font-bold">시작하기</h3>
                <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                  {steps.length - remaining} / {steps.length}
                </span>
              </div>
              <p className="text-muted-foreground">
                아래 순서대로 준비하면 학생에게 문제를 열 수 있습니다.
              </p>
              <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-4">
                {steps.map((step, index) => (
                  <li
                    key={step.label}
                    className={cn(
                      "grid content-start gap-2.5 rounded-lg p-4",
                      step.done ? "bg-success-soft" : "bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-grid size-7 place-items-center rounded-full text-sm font-bold",
                        step.done
                          ? "bg-success text-white"
                          : "bg-card text-muted-foreground",
                      )}
                    >
                      {step.done ? <Check className="size-4" aria-hidden /> : index + 1}
                    </span>
                    <Link
                      href={step.href}
                      className={cn(
                        "font-bold",
                        step.done ? "text-success" : "hover:underline",
                      )}
                    >
                      {step.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}

          <div className="grid gap-gap md:grid-cols-2">
            <StatCard
              icon={<Unlock className="size-5.5" aria-hidden />}
              title="지금 열린 반"
              value={String(data?.openLessonCount ?? 0)}
              unit={`/ ${data?.classroomCount ?? 0}반`}
              ratio={
                data?.classroomCount
                  ? (data.openLessonCount ?? 0) / data.classroomCount
                  : null
              }
            />
            <StatCard
              icon={<BarChart3 className="size-5.5" aria-hidden />}
              title="최근 평균 정답"
              tone="compare"
              value={
                data?.averageCorrect == null ? "–" : data.averageCorrect.toFixed(1)
              }
              unit={
                data?.averageQuestionCount
                  ? `/ ${data.averageQuestionCount}문제`
                  : "아직 기록이 없습니다"
              }
              ratio={
                data?.averageCorrect != null && data.averageQuestionCount
                  ? data.averageCorrect / data.averageQuestionCount
                  : null
              }
            />
          </div>

          <div className="grid gap-gap lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
            <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
              <h3 className="text-lg font-bold">지금 열린 문제</h3>
              {data?.liveLessons?.length ? (
                <ul className="m-0 grid list-none gap-2 p-0">
                  {data.liveLessons.map((live) => (
                    <li
                      key={`${live.classroomId}-${live.lessonNumber}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
                    >
                      <span className="grid gap-0.5">
                        <span className="font-bold">
                          {live.classNo}반 · {live.lessonNumber}차시
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {live.lessonTitle}
                        </span>
                      </span>
                      <span className="text-sm font-medium tabular-nums">
                        {live.responseCount} / {live.studentCount}명 응답
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">열려 있는 차시가 없습니다.</p>
              )}
            </Card>

            <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
              <h3 className="text-lg font-bold">살펴볼 학생</h3>
              <WatchList
                title="아직 답하지 않음"
                students={data?.notRespondedStudents ?? []}
              />
              <WatchList
                title="정답률이 떨어짐"
                students={data?.droppedStudents ?? []}
              />
            </Card>
          </div>
        </>
      )}
    </TeacherShell>
  );
}

function WatchList({
  title,
  students,
}: {
  title: string;
  students: { membershipId?: number; studentName?: string; classNo?: number }[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-bold text-muted-foreground">{title}</span>
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">없습니다.</p>
      ) : (
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {students.map((student) => (
            <li key={student.membershipId} className="text-sm">
              {student.classNo}반 {student.studentName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
