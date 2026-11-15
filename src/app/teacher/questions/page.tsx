"use client";

// 문제 관리 — 차시를 고르고, 그 차시의 문제를 만들고, 반마다 열어 준다.
//
// 문제는 반이 아니라 수업에 속한다. 2학년 과학 1차시 문제를 1반과 2반이 함께 쓴다.
// 반대로 "지금 몇 차시를 열었는가"는 반마다 다르다.
//
// 이미 연 적 있는 차시에는 문제를 더하거나 지울 수 없다. 점수의 분모가 달라지기 때문이다.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-field";
import { LessonOpenControls } from "@/components/teacher/lesson-open-controls";
import { QuestionForm } from "@/components/teacher/question-form";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useTeacherCourse } from "@/components/teacher/use-teacher-course";
import { Card } from "@/components/ui/card";
import {
  createLesson,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  getFindLessonsQueryKey,
  getFindQuestionsQueryKey,
  useFindLessons,
  useFindMyPage,
  useFindQuestions,
} from "@/api/generated";
import type { QuestionRequestSave } from "@/api/generated/model";
import { ApiError } from "@/lib/api-fetcher";
import { cn } from "cn";

export default function TeacherQuestionsPage() {
  const queryClient = useQueryClient();
  const mypage = useFindMyPage();
  const { courseId } = useTeacherCourse(mypage.data?.data.courses ?? []);
  const course = Number(courseId);

  const [selected, setSelected] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lessons = useFindLessons(course, { query: { enabled: Boolean(courseId) } });
  const lessonList = lessons.data?.data ?? [];
  const lessonNumber = selected ?? lessonList[0]?.lessonNumber ?? null;
  const lesson = lessonList.find((item) => item.lessonNumber === lessonNumber);

  const questions = useFindQuestions(course, lessonNumber ?? 0, {
    query: { enabled: Boolean(courseId) && lessonNumber != null },
  });
  const questionList = questions.data?.data ?? [];

  // 한 반이라도 연 적이 있으면 문제 구성을 바꿀 수 없다.
  const everOpened = (lesson?.classrooms ?? []).some(
    (classroom) => classroom.status && classroom.status !== "PLANNED",
  );

  const run = (task: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    void (async () => {
      try {
        await task();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getFindLessonsQueryKey(course) }),
          queryClient.invalidateQueries({
            queryKey: getFindQuestionsQueryKey(course, lessonNumber ?? 0),
          }),
        ]);
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  if (!courseId) {
    return (
      <TeacherShell title="문제 관리">
        <Card className="rounded-lg border border-border p-6 shadow-card ring-0">
          <p className="text-muted-foreground">
            먼저 마이페이지에서 담당 수업을 만들어 주세요.
          </p>
        </Card>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell title="문제 관리">
      <div className="grid gap-gap lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start">
        <Card className="grid gap-4 rounded-lg border border-border p-5 shadow-card ring-0">
          <h2 className="text-lg font-bold">차시</h2>

          {lessons.isPending ? (
            <p className="text-muted-foreground">불러오는 중…</p>
          ) : lessonList.length === 0 ? (
            <p className="text-muted-foreground">아직 차시가 없습니다.</p>
          ) : (
            <ul className="m-0 grid list-none gap-1.5 p-0">
              {lessonList.map((item) => (
                <li key={item.lessonNumber}>
                  <button
                    type="button"
                    aria-current={item.lessonNumber === lessonNumber ? "true" : undefined}
                    onClick={() => setSelected(item.lessonNumber ?? null)}
                    className={cn(
                      "grid w-full gap-0.5 rounded-md border px-4 py-3 text-left transition-colors",
                      item.lessonNumber === lessonNumber
                        ? "border-primary bg-primary-soft text-primary-deep"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <span className="font-bold">{item.lessonNumber}차시</span>
                    <span className="text-sm text-muted-foreground">
                      {item.title} · 문제 {item.questionCount ?? 0}개
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="flex gap-2 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                await createLesson(course, { title: newTitle.trim() });
                setNewTitle("");
              });
            }}
          >
            <AppInput
              placeholder="차시 이름"
              aria-label="차시 이름"
              maxLength={100}
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <AppButton
              type="submit"
              variant="outline"
              className="shrink-0 px-3"
              disabled={!newTitle.trim() || busy}
            >
              <Plus className="size-4" aria-hidden />
              추가
            </AppButton>
          </form>
        </Card>

        {lessonNumber == null ? (
          <Card className="rounded-lg border border-border p-6 shadow-card ring-0">
            <p className="text-muted-foreground">
              차시를 먼저 추가해 주세요. 차시 번호는 자동으로 매겨집니다.
            </p>
          </Card>
        ) : (
          <div className="grid gap-gap">
            <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
              <div className="grid gap-1">
                <h2 className="text-lg font-bold">
                  {lessonNumber}차시 · {lesson?.title}
                </h2>
                <p className="text-muted-foreground">반마다 따로 열고 닫습니다.</p>
              </div>
              <LessonOpenControls
                lessonNumber={lessonNumber}
                classrooms={lesson?.classrooms ?? []}
                hasQuestion={questionList.length > 0}
                busy={busy}
                onRun={run}
              />
            </Card>

            <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">문제 {questionList.length}개</h2>
                {everOpened ? (
                  <span className="text-sm text-muted-foreground">
                    연 적 있는 차시라 더하거나 지울 수 없습니다 (수정은 가능)
                  </span>
                ) : null}
              </div>

              {questions.isPending ? (
                <p className="text-muted-foreground">불러오는 중…</p>
              ) : questionList.length === 0 ? (
                <p className="text-muted-foreground">아직 문제가 없습니다.</p>
              ) : (
                <ul className="m-0 grid list-none gap-2 p-0">
                  {questionList.map((question, index) => (
                    <li
                      key={question.id}
                      className="grid gap-2 rounded-md border border-border px-4 py-3"
                    >
                      {editingId === question.id ? (
                        <QuestionForm
                          busy={busy}
                          initial={question}
                          submitLabel="수정 저장"
                          onCancel={() => setEditingId(null)}
                          onSubmit={(payload: QuestionRequestSave) =>
                            run(async () => {
                              await updateQuestion(question.id ?? 0, payload);
                              setEditingId(null);
                            })
                          }
                        />
                      ) : (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-bold whitespace-pre-wrap">
                              {index + 1}. {question.content}
                            </p>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {question.timeLimitSec}초
                              </span>
                              <button
                                type="button"
                                aria-label={`${index + 1}번 문제 수정`}
                                disabled={busy}
                                onClick={() => setEditingId(question.id ?? null)}
                                className="inline-grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary-deep disabled:opacity-40"
                              >
                                <Pencil className="size-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                aria-label={`${index + 1}번 문제 삭제`}
                                disabled={busy || everOpened}
                                onClick={() =>
                                  run(() => deleteQuestion(question.id ?? 0))
                                }
                                className="inline-grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive disabled:opacity-40"
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </button>
                            </span>
                          </div>
                          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                            {question.options?.map((option) => (
                              <li
                                key={option.id}
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-sm",
                                  option.isCorrect
                                    ? "bg-success-soft font-bold text-success"
                                    : "bg-secondary text-muted-foreground",
                                )}
                              >
                                {option.content}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
              <h2 className="text-lg font-bold">새 문제</h2>
              <QuestionForm
                busy={busy}
                disabled={everOpened}
                disabledReason="이미 연 적 있는 차시에는 문제를 더할 수 없습니다. 점수의 분모가 달라지기 때문입니다."
                onSubmit={(question: QuestionRequestSave) =>
                  run(() => createQuestion(course, lessonNumber, question))
                }
              />
            </Card>
          </div>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </TeacherShell>
  );
}
