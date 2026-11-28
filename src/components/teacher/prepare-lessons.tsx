"use client";

// 차시·문제 준비 — 수업 전에 차시와 문제를 만들어 둔다. 반에 여는 것은 학급 관리에서 한다.
//
// 문제는 반이 아니라 수업(학년·과목)에 속한다. 2학년 과학 1차시 문제를 1반과 2반이 함께 쓴다.
// 이미 연 적 있는 차시에는 문제를 더할 수 없다. 점수의 분모가 달라지기 때문이다.

import { useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-field";
import { ConfirmDelete, losses, withParticle } from "@/components/teacher/confirm-delete";
import { ClassStatusBoard } from "@/components/teacher/class-status-board";
import { CopyPanel } from "@/components/teacher/copy-panel";
import { QuestionForm } from "@/components/teacher/question-form";
import { StudentPreview } from "@/components/teacher/student-preview";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useRun } from "@/components/teacher/use-run";
import { useTeacherCourse } from "@/components/teacher/use-teacher-course";
import { ErrorText, LoadError, LoadingState } from "@/components/states";
import { Chip, Panel } from "@/components/surface";
import { IconButton, TextLink, ToggleChip } from "@/components/text-action";
import { LessonName } from "@/components/lesson-name";
import {
  createLesson,
  createQuestion,
  deleteLesson,
  deleteQuestion,
  renameLesson,
  updateQuestion,
  useFindLessons,
  useFindMyPage,
  useFindQuestions,
} from "@/api/generated";
import type { QuestionRequestSave, QuestionResponseResult } from "@/api/generated/model";
import { toId } from "@/lib/id";
import { cn } from "cn";

export function PrepareLessons() {
  const mypage = useFindMyPage();
  const courses = mypage.data?.data.courses ?? [];
  const { courseId: chosen, setCourseId } = useTeacherCourse(courses);

  // 반 상세의 "문제 수정 →"은 ?course=&lesson=으로 차시를 짚어 보낸다.
  const searchParams = useSearchParams();
  const linked = Number(searchParams.get("lesson")) || null;
  const [linkedCourse, setLinkedCourse] = useState(searchParams.get("course"));
  const courseId = courses.some((item) => String(item.id) === linkedCourse)
    ? (linkedCourse ?? chosen)
    : chosen;
  // courseId는 음수·0일 수도 있다(src/lib/id.ts). 수업이 없으면 null이다.
  const parsedCourse = toId(courseId);
  const hasCourse = parsedCourse != null;
  const course = parsedCourse ?? 0;
  const [selected, setSelected] = useState<number | null>(linked);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionResponseResult | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);
  const [copying, setCopying] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const { run, busy, error } = useRun();

  const lessons = useFindLessons(course, { query: { enabled: hasCourse } });
  const lessonList = lessons.data?.data ?? [];
  // 고른 차시를 지우면 selected는 없는 번호를 가리킨다. 그때는 첫 차시로 돌아간다.
  const stillThere = lessonList.some((item) => item.lessonNumber === selected);
  const lessonNumber = (stillThere ? selected : null) ?? lessonList[0]?.lessonNumber ?? null;
  const lesson = lessonList.find((item) => item.lessonNumber === lessonNumber);

  const questions = useFindQuestions(course, lessonNumber ?? 0, {
    query: { enabled: hasCourse && lessonNumber != null },
  });
  const questionList = questions.data?.data ?? [];

  // 한 반이라도 연 적이 있으면 문제를 더할 수 없다.
  const everOpened = (lesson?.classrooms ?? []).some(
    (room) => room.status && room.status !== "PLANNED",
  );

  const pickLesson = (number: number | null) => {
    setSelected(number);
    setCopying(false);
    setPicked([]);
    setEditingId(null);
    setRenaming(null);
  };

  if (!mypage.isPending && courses.length === 0) {
    return (
      <TeacherShell title="차시·문제 준비">
        <Panel>
          <p className="text-muted-foreground">
            반을 먼저 만들어 주세요. 반을 만들면 차시와 문제를 준비할 수 있어요.
          </p>
          <TextLink href="/teacher">
            학급 관리로 가기
          </TextLink>
        </Panel>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell
      title="차시·문제 준비"
      description="수업 전에 차시와 문제를 만들어 두세요. 한 번 만들면 같은 학년·과목의 모든 반에서 쓸 수 있어요."
    >
      <div role="group" aria-label="수업 선택" className="flex flex-wrap gap-2">
        {courses.map((item) => {
          const on = String(item.id) === courseId;
          return (
            <ToggleChip
              key={item.id}
              pressed={on}
              onClick={() => {
                setLinkedCourse(null);
                setCourseId(String(item.id));
                pickLesson(null);
              }}
            >
              {item.grade}학년 {item.subjectName}
            </ToggleChip>
          );
        })}
      </div>

      <div className="grid gap-gap lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
        <Panel className="gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold">차시</h2>
            <span className="text-sm text-muted-foreground">{lessonList.length}개</span>
          </div>

          {lessons.isError ? (
            <div className="px-1">
              <LoadError error={lessons.error} onRetry={() => void lessons.refetch()} />
            </div>
          ) : lessons.isPending ? (
            <LoadingState />
          ) : lessonList.length === 0 ? (
            <p className="text-muted-foreground">첫 차시를 추가해 주세요.</p>
          ) : (
            <ul className="m-0 grid list-none gap-1 p-0">
              {lessonList.map((item) => {
                const on = item.lessonNumber === lessonNumber;
                return (
                  <li key={item.lessonNumber}>
                    <button
                      type="button"
                      aria-current={on ? "true" : undefined}
                      onClick={() => pickLesson(item.lessonNumber ?? null)}
                      className={cn(
                        "flex min-h-13 w-full items-center gap-2.5 rounded-md border px-3 text-left transition-colors",
                        on
                          ? "border-primary bg-primary-soft text-primary-deep"
                          : "border-transparent hover:bg-secondary",
                      )}
                    >
                      <strong className="min-w-11 text-sm">{item.lessonNumber}차시</strong>
                      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.questionCount ?? 0}문제
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            className="flex gap-2 border-t border-border pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await createLesson(course, { title: newTitle.trim() });
                setNewTitle("");
              });
            }}
          >
            <AppInput
              placeholder="새 차시 이름"
              aria-label="새 차시 이름"
              maxLength={100}
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <AppButton
              type="submit"
              className="shrink-0 px-3"
              disabled={!newTitle.trim() || busy}
            >
              <Plus className="size-4" aria-hidden />
              추가
            </AppButton>
          </form>
        </Panel>

        {lessonNumber == null || !lesson ? (
          <Panel>
            <p className="text-muted-foreground">
              차시를 추가하면 문제를 만들 수 있어요.
            </p>
          </Panel>
        ) : (
          <div className="grid gap-gap">
            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {renaming == null ? (
                  <h2 className="text-xl font-extrabold">
                    <LessonName number={lessonNumber} title={lesson.title} />
                  </h2>
                ) : (
                  <form
                    className="flex flex-wrap gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void run(async () => {
                        await renameLesson(course, lessonNumber, { title: renaming.trim() });
                        setRenaming(null);
                      });
                    }}
                  >
                    <AppInput
                      aria-label="차시 이름"
                      maxLength={100}
                      value={renaming}
                      onChange={(event) => setRenaming(event.target.value)}
                      className="w-60"
                    />
                    <AppButton type="submit" disabled={!renaming.trim() || busy}>
                      저장
                    </AppButton>
                    <AppButton type="button" variant="outline" onClick={() => setRenaming(null)}>
                      취소
                    </AppButton>
                  </form>
                )}
                <div className="flex flex-wrap gap-2">
                  <AppButton
                    variant="outline"
                    className="h-10 px-3.5"
                    disabled={questionList.length === 0}
                    onClick={() => setPreviewing(true)}
                  >
                    <Eye className="size-4" aria-hidden />
                    학생 화면 미리보기
                  </AppButton>
                  <AppButton
                    variant="outline"
                    className="h-10 px-3.5"
                    aria-expanded={copying}
                    disabled={questionList.length === 0}
                    onClick={() => {
                      setCopying(!copying);
                      setPicked([]);
                    }}
                  >
                    <Copy className="size-4" aria-hidden />
                    복사
                  </AppButton>
                  <AppButton
                    variant="outline"
                    className="h-10 px-3.5"
                    disabled={busy}
                    onClick={() => setRenaming(lesson.title ?? "")}
                  >
                    <Pencil className="size-4" aria-hidden />
                    이름 수정
                  </AppButton>
                  <AppButton
                    variant="outline"
                    className="h-10 px-3.5 text-destructive hover:bg-destructive-soft"
                    disabled={busy}
                    onClick={() => setDeletingLesson(true)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    삭제
                  </AppButton>
                </div>
              </div>

              {(lesson.classrooms ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  아직 이 학년·과목에 반이 없어요. 반을 만들면 반마다 진행 상황이 여기에 보여요.
                </p>
              ) : (
                <ClassStatusBoard
                  classrooms={lesson.classrooms ?? []}
                  lessonNumber={lessonNumber ?? 0}
                />
              )}
            </Panel>

            {copying ? (
              <CopyPanel
                courseId={course}
                lessonNumber={lessonNumber}
                courses={courses}
                picked={picked}
                onSelectAll={() => setPicked(questionList.map((q) => q.id ?? 0))}
                onClose={() => {
                  setCopying(false);
                  setPicked([]);
                }}
              />
            ) : null}

            <Panel className="gap-0 p-0 sm:p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <h3 className="text-lg font-bold">문제 {questionList.length}개</h3>
                {everOpened ? (
                  <span className="text-sm text-muted-foreground">
                    이미 연 차시라 새 문제를 넣을 수 없어요
                  </span>
                ) : null}
              </div>

              {questions.isPending ? (
                <LoadingState className="border-t border-border px-5 py-6 text-muted-foreground" />
              ) : questionList.length === 0 ? (
                <p className="border-t border-border px-5 py-7 text-center text-muted-foreground">
                  아직 문제가 없어요. 문제를 하나 이상 넣어야 수업에서 열 수 있어요.
                </p>
              ) : (
                <ul className="m-0 grid list-none p-0">
                  {questionList.map((question, index) => {
                    const id = question.id ?? 0;
                    return (
                      <li key={id} className="grid gap-2 border-t border-border px-5 py-3.5">
                        {editingId === id ? (
                          <QuestionForm
                            busy={busy}
                            initial={question}
                            submitLabel="수정 저장"
                            onCancel={() => setEditingId(null)}
                            onSubmit={(payload: QuestionRequestSave) =>
                              void run(async () => {
                                await updateQuestion(id, payload);
                                setEditingId(null);
                              })
                            }
                          />
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
                              {copying ? (
                                <input
                                  type="checkbox"
                                  aria-label={`${index + 1}번 문제 복사에 포함`}
                                  className="size-5 accent-primary"
                                  checked={picked.includes(id)}
                                  onChange={(event) =>
                                    setPicked(
                                      event.target.checked
                                        ? [...picked, id]
                                        : picked.filter((value) => value !== id),
                                    )
                                  }
                                />
                              ) : null}
                              <strong className="min-w-6 text-muted-foreground">{index + 1}</strong>
                              <Chip tone="bg-secondary text-muted-foreground">
                                {question.type === "SHORT_ANSWER" ? "주관식" : "객관식"}
                              </Chip>
                              <span className="min-w-0 flex-1 basis-64 whitespace-pre-wrap">
                                {question.content}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {question.timeLimitSec}초
                              </span>
                              <span className="flex gap-1">
                                <IconButton
                                  tone="neutral"
                                  aria-label={`${index + 1}번 문제 수정`}
                                  disabled={busy}
                                  onClick={() => setEditingId(id)}
                                >
                                  <Pencil className="size-4" aria-hidden />
                                </IconButton>
                                <IconButton
                                  tone="danger"
                                  aria-label={`${index + 1}번 문제 삭제`}
                                  disabled={busy}
                                  onClick={() => setDeletingQuestion(question)}
                                >
                                  <Trash2 className="size-4" aria-hidden />
                                </IconButton>
                              </span>
                            </div>
                            {question.options?.length ? (
                              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 pl-9">
                                {question.options.map((option) => (
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
                            ) : null}
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel>
              <h3 className="text-lg font-bold">새 문제</h3>
              <QuestionForm
                busy={busy}
                disabled={everOpened}
                disabledReason="이미 학생에게 연 차시예요. 새 문제는 다음 차시에 넣어 주세요."
                onSubmit={(question: QuestionRequestSave) =>
                  void run(() => createQuestion(course, lessonNumber, question))
                }
              />
            </Panel>
          </div>
        )}
      </div>

      <ErrorText error={error} />

      <ConfirmDelete
        open={deletingQuestion != null}
        onOpenChange={() => setDeletingQuestion(null)}
        title="이 문제를 지울까요?"
        losses={[]}
        busy={busy}
        onConfirm={() => {
          const id = deletingQuestion?.id ?? 0;
          setDeletingQuestion(null);
          void run(() => deleteQuestion(id));
        }}
      />

      <ConfirmDelete
        open={deletingLesson}
        onOpenChange={() => setDeletingLesson(false)}
        title={`${lessonNumber}차시 ${withParticle(lesson?.title ?? "")} 지울까요?`}
        losses={losses({ count: questionList.length, label: "문제", unit: "개" })}
        busy={busy}
        onConfirm={() => {
          const number = lessonNumber ?? 0;
          setDeletingLesson(false);
          void run(async () => {
            await deleteLesson(course, number);
            // 지운 차시의 문제를 다시 부르면 404가 난다. 새로 받기 전에 다른 차시로 먼저 넘긴다.
            const next = lessonList.find((item) => item.lessonNumber !== number);
            flushSync(() => pickLesson(next?.lessonNumber ?? null));
          });
        }}
      />

      {lessonNumber != null ? (
        <StudentPreview
          open={previewing}
          onOpenChange={setPreviewing}
          courseId={course}
          lessonNumber={lessonNumber}
          lessonTitle={lesson?.title}
        />
      ) : null}
    </TeacherShell>
  );
}
