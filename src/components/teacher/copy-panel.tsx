"use client";

// 차시·문제 복사 — 같은 수업의 새 차시나 다른 차시, 또는 다른 학년·과목으로.
//
// 문제를 고르지 않으면 차시 전체를 복사한다. 대상 차시를 비우면 원본 제목으로 새 차시가 생긴다.
// 복사한 문제는 원본과 따로 수정된다. 학생 풀이 기록은 복사되지 않는다.

import { useState } from "react";

import { AppButton } from "@/components/app-button";
import { AppSelect } from "@/components/app-select";
import { useRun } from "@/components/teacher/use-run";
import { ErrorText } from "@/components/states";
import { Callout, Panel } from "@/components/surface";
import { lessonLabel } from "@/components/lesson-name";
import { copyQuestions, useFindLessons } from "@/api/generated";
import type { TeacherResponseCourse } from "@/api/generated/model";

const NEW_LESSON = "new";

export function CopyPanel({
  courseId,
  lessonNumber,
  courses,
  picked,
  onSelectAll,
  onClose,
}: {
  courseId: number;
  lessonNumber: number;
  courses: TeacherResponseCourse[];
  /** 고른 문제 id. 비어 있으면 전체 */
  picked: number[];
  onSelectAll: () => void;
  onClose: () => void;
}) {
  const [target, setTarget] = useState(String(courseId));
  const [targetLesson, setTargetLesson] = useState(NEW_LESSON);
  const [done, setDone] = useState<string | null>(null);
  const { run, busy, error } = useRun();

  const targetId = Number(target);
  const lessons = useFindLessons(targetId);
  const targetCourse = courses.find((course) => course.id === targetId);
  const label = (course?: TeacherResponseCourse) =>
    course ? `${course.grade}학년 ${course.subjectName}` : "";

  const lessonItems = [
    { value: NEW_LESSON, label: "새 차시로 만들기" },
    ...(lessons.data?.data ?? [])
      .filter((lesson) => !(targetId === courseId && lesson.lessonNumber === lessonNumber))
      .map((lesson) => ({
        value: String(lesson.lessonNumber),
        label: `${lessonLabel(lesson.lessonNumber, lesson.title)}에 추가`,
      })),
  ];

  const copy = () =>
    run(async () => {
      const { data } = await copyQuestions(courseId, lessonNumber, {
        targetCourseId: targetId,
        targetLessonNumber: targetLesson === NEW_LESSON ? null : Number(targetLesson),
        questionIds: picked.length ? picked : null,
      });
      setDone(
        `${label(targetCourse)} ${data.targetLessonNumber}차시에 ${data.copiedCount}문제를 복사했어요.`,
      );
    });

  return (
    <Panel className="border-primary bg-primary-soft">
      <strong>어디로 복사할까요?</strong>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold">
          학년·과목
          <AppSelect
            items={courses.map((course) => ({ value: String(course.id), label: label(course) }))}
            value={target}
            onValueChange={(value) => {
              setTarget(value);
              setTargetLesson(NEW_LESSON);
              setDone(null);
            }}
            placeholder="수업 선택"
            className="bg-card"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          차시
          <AppSelect
            items={lessonItems}
            value={targetLesson}
            onValueChange={(value) => {
              setTargetLesson(value);
              setDone(null);
            }}
            placeholder="차시 선택"
            className="bg-card"
          />
        </label>
      </div>
      <span className="text-sm">
        아래 목록에서 복사할 문제를 골라 주세요. 고르지 않으면 차시 전체를 복사해요. 지금{" "}
        <strong>{picked.length}문제</strong> 선택됨
      </span>
      <div className="flex flex-wrap gap-2">
        <AppButton disabled={busy} onClick={() => void copy()}>
          {picked.length ? `${picked.length}문제 복사하기` : "차시 전체 복사하기"}
        </AppButton>
        <AppButton variant="outline" className="bg-card" onClick={onSelectAll}>
          전체 선택
        </AppButton>
        <AppButton variant="outline" className="bg-card" onClick={onClose}>
          닫기
        </AppButton>
      </div>
      {done ? (
        <Callout tone="success" role="status" className="text-sm font-bold">
          {done}
        </Callout>
      ) : null}
      <ErrorText error={error} />
      <span className="text-sm text-muted-foreground">
        복사한 문제는 원본과 따로 고칠 수 있어요.
      </span>
    </Panel>
  );
}
