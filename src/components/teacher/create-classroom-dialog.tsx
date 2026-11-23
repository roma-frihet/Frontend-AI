"use client";

// 반 만들기. 반은 수업(학년 + 과목)에 속하므로 수업을 먼저 고른다.
// 아직 없는 학년·과목이면 그 자리에서 수업을 함께 만든다.
//
// 반 번호는 1~20. 이미 있는 반 번호는 고를 수 없다.

import { useState } from "react";

import { AppButton } from "@/components/app-button";
import { AppField } from "@/components/app-field";
import { AppSelect } from "@/components/app-select";
import { ErrorText, useRun } from "@/components/teacher/use-run";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClassroom, createCourse, useFindSubjects } from "@/api/generated";
import type { TeacherResponseCourse } from "@/api/generated/model";

const MAX_GRADE = 3;
const MAX_CLASS_NO = 20;
const NEW_COURSE = "new";

export function CreateClassroomDialog({
  open,
  onOpenChange,
  courses,
  schoolId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: TeacherResponseCourse[];
  schoolId: number | null;
}) {
  const subjects = useFindSubjects({ schoolLevel: "MIDDLE" }, { query: { enabled: open } });
  const { run, busy, error, setError } = useRun();

  const [courseId, setCourseId] = useState("");
  const [grade, setGrade] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classNo, setClassNo] = useState("");

  const picked = courseId || (courses.length ? String(courses[0].id) : NEW_COURSE);
  const course = courses.find((item) => String(item.id) === picked);
  const isNew = picked === NEW_COURSE;

  const taken = new Set((course?.classrooms ?? []).map((room) => room.classNo));
  const classItems = Array.from({ length: MAX_CLASS_NO }, (_, i) => i + 1)
    .filter((n) => !taken.has(n))
    .map((n) => ({ value: String(n), label: `${n}반` }));

  const ready = Boolean(classNo) && (!isNew || (grade && subjectId));

  const reset = () => {
    setCourseId("");
    setGrade("");
    setSubjectId("");
    setClassNo("");
    setError(null);
  };

  const submit = () =>
    run(async () => {
      let targetId = course?.id ?? null;
      if (isNew) {
        const { data } = await createCourse({
          schoolId,
          grade: Number(grade),
          subjectId: Number(subjectId),
        });
        targetId = data.id ?? null;
      }
      await createClassroom({ courseId: targetId, classNo: Number(classNo) });
    }).then((ok) => {
      if (ok) {
        reset();
        onOpenChange(false);
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>반 만들기</DialogTitle>
          <DialogDescription>
            같은 학년·과목의 반은 차시와 문제를 함께 씁니다.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-classroom"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) void submit();
          }}
        >
          <AppField label="수업">
            <AppSelect
              items={[
                ...courses.map((item) => ({
                  value: String(item.id),
                  label: `${item.grade}학년 ${item.subjectName}`,
                })),
                { value: NEW_COURSE, label: "새 학년·과목 추가" },
              ]}
              value={picked}
              onValueChange={(value) => {
                setCourseId(value);
                setClassNo("");
              }}
              placeholder="수업 선택"
            />
          </AppField>

          {isNew ? (
            <div className="grid grid-cols-2 gap-3">
              <AppField label="학년">
                <AppSelect
                  items={Array.from({ length: MAX_GRADE }, (_, i) => ({
                    value: String(i + 1),
                    label: `${i + 1}학년`,
                  }))}
                  value={grade}
                  onValueChange={setGrade}
                  placeholder="학년"
                />
              </AppField>
              <AppField label="과목">
                <AppSelect
                  items={(subjects.data?.data ?? []).map((subject) => ({
                    value: String(subject.id),
                    label: subject.name ?? "",
                  }))}
                  value={subjectId}
                  onValueChange={setSubjectId}
                  placeholder="과목"
                />
              </AppField>
            </div>
          ) : null}

          <AppField label="반">
            <AppSelect
              items={classItems}
              value={classNo}
              onValueChange={setClassNo}
              placeholder="반 번호"
            />
          </AppField>

          <ErrorText error={error} />
        </form>

        <DialogFooter>
          <DialogClose render={<AppButton variant="outline">취소</AppButton>} />
          <AppButton type="submit" form="create-classroom" disabled={!ready || busy}>
            만들기
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
