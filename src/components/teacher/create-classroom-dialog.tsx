"use client";

// 반 만들기. 선생님은 학년·과목·반 번호만 고른다.
//
// 서버에서는 반이 수업(학년 + 과목)에 속하지만, 그 구분은 화면에 드러내지 않는다.
// 고른 학년·과목의 수업이 이미 있으면 거기에 반을 붙이고, 없으면 수업부터 만든다.
//
// 반 번호는 1~20. 같은 학년·과목에 이미 있는 반 번호는 고를 수 없다.

import { useState } from "react";

import { AppButton } from "@/components/app-button";
import { AppField } from "@/components/app-field";
import { AppSelect } from "@/components/app-select";
import { useRun } from "@/components/teacher/use-run";
import { ErrorText, LOADING_TEXT } from "@/components/states";
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

  const [grade, setGrade] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classNo, setClassNo] = useState("");

  // 고른 학년·과목의 수업이 이미 있는지. 있으면 그 수업의 반 번호는 고를 수 없다.
  const course = courses.find(
    (item) => String(item.grade) === grade && String(item.subjectId) === subjectId,
  );

  const taken = new Set((course?.classrooms ?? []).map((room) => room.classNo));
  const classItems = Array.from({ length: MAX_CLASS_NO }, (_, i) => i + 1)
    .filter((n) => !taken.has(n))
    .map((n) => ({ value: String(n), label: `${n}반` }));

  const ready = Boolean(grade && subjectId && classNo);

  const reset = () => {
    setGrade("");
    setSubjectId("");
    setClassNo("");
    setError(null);
  };

  const submit = () =>
    run(async () => {
      let targetId = course?.id ?? null;
      if (!course) {
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
          <DialogDescription>학년과 과목, 반 번호를 골라 주세요.</DialogDescription>
        </DialogHeader>

        <form
          id="create-classroom"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) void submit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <AppField label="학년" htmlFor="new-classroom-grade">
              <AppSelect
                id="new-classroom-grade"
                items={Array.from({ length: MAX_GRADE }, (_, i) => ({
                  value: String(i + 1),
                  label: `${i + 1}학년`,
                }))}
                value={grade}
                onValueChange={(value) => {
                  setGrade(value);
                  setClassNo("");
                }}
                placeholder="학년"
              />
            </AppField>
            <AppField label="과목" htmlFor="new-classroom-subject">
              <AppSelect
                id="new-classroom-subject"
                items={(subjects.data?.data ?? []).map((subject) => ({
                  value: String(subject.id),
                  label: subject.name ?? "",
                }))}
                value={subjectId}
                onValueChange={(value) => {
                  setSubjectId(value);
                  setClassNo("");
                }}
                placeholder={subjects.isPending ? LOADING_TEXT : "과목"}
              />
            </AppField>
          </div>

          <AppField label="반" htmlFor="new-classroom-no">
            <AppSelect
              id="new-classroom-no"
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
