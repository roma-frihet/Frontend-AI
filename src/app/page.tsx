"use client";

// 학생 홈. 역할 선택 화면 없이 `/`가 곧 학생의 학습 리포트다.
//
// 아직 어느 반에도 들어가지 않았으면 수업 코드 입력이 먼저다.
// 반이 여럿이면 위에서 고른다(한 학생이 여러 과목에 연결될 수 있다).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  KeyRound,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppSelect } from "@/components/app-select";
import {
  AppTabs,
  AppTabsContent,
  AppTabsList,
  AppTabsTrigger,
} from "@/components/app-tabs";
import { Brand } from "@/components/brand";
import { JoinClassroomCard } from "@/components/student/join-classroom-card";
import { PastLessonsTab } from "@/components/student/past-lessons-tab";
import { ScoreChart } from "@/components/student/score-chart";
import { ScoreTable } from "@/components/student/score-table";
import { StatCard } from "@/components/student/stat-card";
import { WrongQuestionsTab } from "@/components/student/wrong-questions-tab";
import { LoadingState } from "@/components/states";
import { Panel } from "@/components/surface";
import { useFindMyClassrooms, useFindMyReport } from "@/api/generated";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function StudentHomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [classroomId, setClassroomId] = useState("");
  const [joining, setJoining] = useState(false);

  // 로그인하지 않았으면 볼 것이 없다.
  useEffect(() => {
    const check = async () => {
      const { data } = await getSupabaseClient().auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    };

    void check();
  }, [router]);

  const classrooms = useFindMyClassrooms({ query: { enabled: ready } });
  const memberships = classrooms.data?.data ?? [];

  // 고른 반이 없으면 첫 반을 본다. 상태로 들고 있지 않고 그때그때 계산한다.
  const selectedId = classroomId || String(memberships[0]?.classroomId ?? "");

  const report = useFindMyReport(Number(selectedId), {
    query: { enabled: Boolean(selectedId) },
  });
  const data = report.data?.data;

  const latest = data?.latestScore;
  const openLesson = data?.openLesson;
  const questionCount = latest?.questionCount ?? 0;

  // 최근 차시는 많이 보여 줄 필요가 없다. 전체는 "차시별 기록" 탭에 있다.
  const recentScores = [...(data?.scores ?? [])].reverse().slice(0, 5);

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-(--container-page) items-center justify-between gap-4 px-4 py-4">
          <Brand badge="학생" href="/" />
          <AppButton
            variant="outline"
            onClick={() => setJoining((open) => !open)}
          >
            <KeyRound className="size-4" aria-hidden />
            수업 참여하기
          </AppButton>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-(--container-page) gap-gap px-4 py-6">
        {classrooms.isPending ? (
          <LoadingState />
        ) : memberships.length === 0 ? (
          <JoinClassroomCard />
        ) : (
          <>
            {joining ? (
              <JoinClassroomCard onJoined={() => setJoining(false)} />
            ) : null}

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="grid gap-0.5">
                <h1 className="text-2xl font-extrabold">
                  {data
                    ? `${data.grade}학년 ${data.subjectName} ${data.classNo}반`
                    : "학습 리포트"}
                </h1>
              </div>

              {memberships.length > 1 ? (
                <AppSelect
                  items={memberships.map((membership) => ({
                    value: String(membership.classroomId),
                    label: `${membership.grade}학년 ${membership.subjectName} ${membership.classNo}반`,
                  }))}
                  value={selectedId}
                  onValueChange={setClassroomId}
                  placeholder="수업 선택"
                  className="w-auto min-w-60"
                />
              ) : null}
            </div>

            <AppTabs defaultValue="report" className="min-w-0 gap-gap">
              <AppTabsList>
                <AppTabsTrigger value="report">
                  <Target className="size-4.5" aria-hidden />
                  학습 리포트
                </AppTabsTrigger>
                <AppTabsTrigger value="scores">
                  <TrendingUp className="size-4.5" aria-hidden />
                  차시별 기록
                </AppTabsTrigger>
                <AppTabsTrigger value="past">
                  <BookOpen className="size-4.5" aria-hidden />
                  지난 차시
                </AppTabsTrigger>
                <AppTabsTrigger value="wrong">
                  <FileText className="size-4.5" aria-hidden />
                  틀린 문제
                </AppTabsTrigger>
              </AppTabsList>

              <AppTabsContent value="report" className="grid gap-gap">
                {report.isPending ? (
                  <LoadingState />
                ) : (
                  <div className="grid gap-gap md:grid-cols-3">
                    <StatCard
                      icon={<Target className="size-5.5" aria-hidden />}
                      title="최근 차시 정답"
                      value={
                        latest?.correctCount == null
                          ? "–"
                          : String(latest.correctCount)
                      }
                      unit={
                        questionCount
                          ? `/ ${questionCount}문제`
                          : "아직 기록이 없어요"
                      }
                      ratio={
                        latest?.correctCount != null && questionCount
                          ? latest.correctCount / questionCount
                          : null
                      }
                    />
                    <StatCard
                      icon={<BarChart3 className="size-5.5" aria-hidden />}
                      title="반 평균 정답"
                      tone="compare"
                      value={
                        latest?.classAverageCorrect == null
                          ? "–"
                          : latest.classAverageCorrect.toFixed(1)
                      }
                      unit={
                        questionCount ? `/ ${questionCount}문제` : undefined
                      }
                      ratio={
                        latest?.classAverageCorrect != null && questionCount
                          ? latest.classAverageCorrect / questionCount
                          : null
                      }
                    />

                    <Panel className="content-between gap-3">
                      <div className="flex items-center gap-2.5 font-bold">
                        <KeyRound
                          className="size-5.5 text-primary"
                          aria-hidden
                        />
                        <span>지금 열린 문제</span>
                      </div>
                      {openLesson ? (
                        <>
                          <div className="grid gap-0.5">
                            <p className="font-bold text-primary-deep">
                              {openLesson.lessonNumber}차시
                            </p>
                            <p className="text-muted-foreground">
                              {openLesson.title}
                            </p>
                          </div>
                          <AppButton
                            block
                            onClick={() =>
                              router.push(
                                `/lessons/${selectedId}/${openLesson.lessonNumber}`,
                              )
                            }
                          >
                            문제 풀기
                          </AppButton>
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          지금은 풀 문제가 없어요. 선생님이 열어 주면 여기에
                          보여요.
                        </p>
                      )}
                    </Panel>
                  </div>
                )}

                {/* 목업의 grid-main — 왼쪽은 추이, 오른쪽은 최근 기록 */}
                <div className="grid gap-gap lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
                  <Panel>
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <TrendingUp className="size-5 text-primary" aria-hidden />
                        <h2 className="text-lg font-bold">나의 변화</h2>
                      </div>
                      <p className="text-muted-foreground">
                        차시별 점수 추이와 반 평균을 함께 비교해요.
                      </p>
                    </div>
                    {data?.scores?.length ? (
                      <ScoreChart scores={data.scores} />
                    ) : (
                      <p className="text-muted-foreground">
                        두 번 이상 풀면 그래프로 볼 수 있어요.
                      </p>
                    )}
                  </Panel>

                  <div className="grid gap-gap">
                    <Panel>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <CalendarDays
                          className="size-5 text-accent-deep"
                          aria-hidden
                        />
                        <h2 className="text-lg font-bold">최근 차시</h2>
                      </div>
                      {recentScores.length ? (
                        <ol className="m-0 grid list-none gap-2 p-0">
                          {recentScores.map((score) => (
                            <li
                              key={score.lessonNumber}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="font-medium">
                                {score.lessonNumber}차시
                              </span>
                              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-sm font-bold text-primary-deep tabular-nums">
                                {score.correctCount == null
                                  ? "응답 안 함"
                                  : `${score.correctCount} / ${score.questionCount}`}
                              </span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-muted-foreground">
                          푼 차시가 여기에 쌓여요.
                        </p>
                      )}
                    </Panel>

                    <Panel>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <FileText className="size-5 text-destructive" aria-hidden />
                        <h2 className="text-lg font-bold">최근 틀린 문제</h2>
                      </div>
                      {data?.recentWrongQuestions?.length ? (
                        <ol className="m-0 grid list-none gap-2.5 p-0">
                          {data.recentWrongQuestions.map((wrong) => (
                            <li
                              key={`${wrong.lessonNumber}-${wrong.questionIndex}`}
                              className="grid gap-0.5"
                            >
                              <span className="text-sm text-muted-foreground">
                                {wrong.lessonNumber}차시
                              </span>
                              <span className="font-medium">{wrong.content}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-muted-foreground">
                          수업이 끝나면 틀린 문제를 여기에서 다시 볼 수 있어요.
                        </p>
                      )}
                    </Panel>
                  </div>
                </div>
              </AppTabsContent>

              <AppTabsContent value="scores">
                <Panel>
                  <h2 className="text-lg font-bold">차시별 기록</h2>
                  {data?.scores?.length ? (
                    <ScoreTable scores={data.scores} />
                  ) : (
                    <p className="text-muted-foreground">
                      문제를 풀면 차시마다 기록이 여기에 쌓여요.
                    </p>
                  )}
                </Panel>
              </AppTabsContent>

              <AppTabsContent value="past">
                {selectedId ? (
                  <PastLessonsTab classroomId={Number(selectedId)} />
                ) : null}
              </AppTabsContent>

              <AppTabsContent value="wrong">
                {selectedId ? (
                  <WrongQuestionsTab classroomId={Number(selectedId)} />
                ) : null}
              </AppTabsContent>
            </AppTabs>
          </>
        )}
      </main>
    </div>
  );
}
