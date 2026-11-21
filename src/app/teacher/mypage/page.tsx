"use client";

// 교사 마이페이지 — 내 정보와, 담당 수업·반을 만들고 지우는 곳.
//
// 수업은 학년 + 과목이다. 같은 과목이라도 학년이 다르면 다른 수업이다.
// 반은 번호만 받는다(1~20). 차시는 문제 관리에서 추가한다.
//
// 삭제하면 안에 든 것이 함께 사라진다. 서버는 기록이 있어도 지우므로, 막아 주는 것은
// 확인 모달뿐이다. 무엇이 몇 개 사라지는지 숫자로 보여 주고 받는다.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus, Trash2, UserRound } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AppSelect } from "@/components/app-select";
import {
  ConfirmDelete,
  losses,
  withParticle,
} from "@/components/teacher/confirm-delete";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { Card } from "@/components/ui/card";
import {
  createClassroom,
  createCourse,
  saveTeacherProfile,
  deleteClassroom,
  deleteCourse,
  getFindClassroomsQueryKey,
  getFindMyPageQueryKey,
  useFindClassrooms,
  useFindMyPage,
  useFindSubjects,
} from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";

const MAX_GRADE = 3;
const MAX_CLASS_NO = 20;

const gradeItems = Array.from({ length: MAX_GRADE }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}));

export default function TeacherMyPage() {
  const queryClient = useQueryClient();
  const mypage = useFindMyPage();
  const profile = mypage.data?.data.profile;
  const courses = mypage.data?.data.courses ?? [];

  const subjects = useFindSubjects({ schoolLevel: "MIDDLE" });
  // 삭제 확인에 쓸 학생 수는 마이페이지에 없고 반 목록에만 있다.
  const classroomsQuery = useFindClassrooms();
  const studentCounts = new Map(
    (classroomsQuery.data?.data ?? []).map((classroom) => [
      classroom.id,
      classroom.studentCount ?? 0,
    ]),
  );

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<
    (typeof courses)[number] | null
  >(null);
  const [deletingClassroom, setDeletingClassroom] = useState<{
    id: number;
    classNo: number;
  } | null>(null);

  // 반을 지우면 학생 수도 달라지므로 두 질의를 함께 새로 고친다.
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: getFindMyPageQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getFindClassroomsQueryKey() });
  };

  const run = async (task: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await task();
      await refresh();
    } catch (caught) {
      // 서버 detail은 사람에게 그대로 보여 줘도 되는 문장이다.
      setError(
        caught instanceof ApiError
          ? caught.message
          : "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  const addCourse = () =>
    run(async () => {
      await createCourse({
        schoolId: profile?.schoolId ?? null,
        grade: Number(grade),
        subjectId: Number(subjectId),
      });
      setGrade("");
      setSubjectId("");
    });

  return (
    <TeacherShell title="마이페이지">
      <div className="grid gap-gap lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
        <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
          <div className="flex items-center gap-2.5">
            <UserRound className="size-5 text-accent-deep" aria-hidden />
            <h2 className="text-lg font-bold">내 정보</h2>
          </div>
          {editingProfile ? (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                run(async () => {
                  await saveTeacherProfile({
                    schoolId: profile?.schoolId ?? null,
                    name: name.trim(),
                  });
                  setEditingProfile(false);
                });
              }}
            >
              <AppField label="이름" htmlFor="name">
                <AppInput
                  id="name"
                  maxLength={50}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </AppField>
              <Row label="학교" value={profile?.schoolName} />
              <div className="flex justify-end gap-2">
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProfile(false)}
                >
                  취소
                </AppButton>
                <AppButton type="submit" disabled={!name.trim() || busy}>
                  저장
                </AppButton>
              </div>
            </form>
          ) : (
            <>
              <dl className="grid gap-3">
                <Row label="이름" value={profile?.name} />
                <Row label="학교" value={profile?.schoolName} />
              </dl>
              <AppButton
                variant="outline"
                className="justify-self-start"
                onClick={() => {
                  setName(profile?.name ?? "");
                  setEditingProfile(true);
                }}
              >
                <Pencil className="size-4" aria-hidden />
                이름 수정
              </AppButton>
            </>
          )}
        </Card>

        <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
          <div className="grid gap-1">
            <div className="flex items-center gap-2.5">
              <BookOpen className="size-5 text-primary" aria-hidden />
              <h2 className="text-lg font-bold">담당 수업과 반</h2>
            </div>
            <p className="text-muted-foreground">
              수업마다 맡은 반을 추가하세요. 차시는 문제 관리에서 추가합니다.
            </p>
          </div>

          {mypage.isPending ? (
            <p className="text-muted-foreground">불러오는 중…</p>
          ) : courses.length === 0 ? (
            <p className="text-muted-foreground">
              아직 수업이 없습니다. 아래에서 학년과 과목을 골라 만들어 주세요.
            </p>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {courses.map((course) => (
                <li
                  key={course.id}
                  className="grid gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">
                      {course.grade}학년 {course.subjectName}
                      <span className="ml-2 text-sm font-medium text-muted-foreground">
                        차시 {course.lessonCount ?? 0}개
                      </span>
                    </span>
                    <IconButton
                      label="수업 삭제"
                      disabled={busy}
                      onClick={() => setDeletingCourse(course)}
                    />
                  </div>

                  <ClassroomRow
                    classrooms={course.classrooms ?? []}
                    busy={busy}
                    onAdd={(classNo) =>
                      run(() =>
                        createClassroom({ courseId: course.id ?? null, classNo }),
                      )
                    }
                    onRemove={(classroomId, classNo) =>
                      setDeletingClassroom({ id: classroomId, classNo })
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-2 border-t border-border pt-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end">
            <AppSelect
              items={gradeItems}
              value={grade}
              onValueChange={setGrade}
              placeholder="학년"
              className="w-28"
            />
            <AppSelect
              items={(subjects.data?.data ?? []).map((subject) => ({
                value: String(subject.id),
                label: subject.name ?? "",
              }))}
              value={subjectId}
              onValueChange={setSubjectId}
              placeholder="과목"
            />
            <AppButton
              variant="outline"
              disabled={!grade || !subjectId || busy}
              onClick={addCourse}
            >
              <Plus className="size-4" aria-hidden />
              수업 추가
            </AppButton>
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </Card>
      </div>

      <ConfirmDelete
        open={deletingCourse != null}
        onOpenChange={() => setDeletingCourse(null)}
        title={`${deletingCourse?.grade}학년 ${withParticle(deletingCourse?.subjectName ?? "")} 지울까요?`}
        losses={losses(
          { count: deletingCourse?.classrooms?.length ?? 0, label: "반", unit: "개" },
          {
            count: (deletingCourse?.classrooms ?? []).reduce(
              (sum, classroom) => sum + (studentCounts.get(classroom.id) ?? 0),
              0,
            ),
            label: "학생",
            unit: "명",
          },
          { count: deletingCourse?.lessonCount ?? 0, label: "차시", unit: "개" },
        )}
        busy={busy}
        onConfirm={() => {
          const id = deletingCourse?.id ?? 0;
          setDeletingCourse(null);
          run(() => deleteCourse(id));
        }}
      />

      <ConfirmDelete
        open={deletingClassroom != null}
        onOpenChange={() => setDeletingClassroom(null)}
        title={`${deletingClassroom?.classNo}반을 지울까요?`}
        losses={losses({
          count: studentCounts.get(deletingClassroom?.id) ?? 0,
          label: "학생",
          unit: "명",
        })}
        busy={busy}
        onConfirm={() => {
          const id = deletingClassroom?.id ?? 0;
          setDeletingClassroom(null);
          run(() => deleteClassroom(id));
        }}
      />
    </TeacherShell>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="m-0 font-bold">{value ?? "–"}</dd>
    </div>
  );
}

function ClassroomRow({
  classrooms,
  busy,
  onAdd,
  onRemove,
}: {
  classrooms: { id?: number; classNo?: number }[];
  busy: boolean;
  onAdd: (classNo: number) => void;
  onRemove: (classroomId: number, classNo: number) => void;
}) {
  const [classNo, setClassNo] = useState("");

  // 이미 있는 반은 다시 만들 수 없다.
  const taken = new Set(classrooms.map((classroom) => classroom.classNo));
  const items = Array.from({ length: MAX_CLASS_NO }, (_, i) => i + 1)
    .filter((n) => !taken.has(n))
    .map((n) => ({ value: String(n), label: `${n}반` }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {classrooms.map((classroom) => (
        <span
          key={classroom.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-1 pr-1.5 pl-3 text-sm font-bold text-primary-deep"
        >
          {classroom.classNo}반
          <IconButton
            label={`${classroom.classNo}반 삭제`}
            small
            disabled={busy}
            onClick={() => onRemove(classroom.id ?? 0, classroom.classNo ?? 0)}
          />
        </span>
      ))}

      <AppSelect
        items={items}
        value={classNo}
        onValueChange={setClassNo}
        placeholder="반 추가"
        className="h-9 w-28"
      />
      <AppButton
        variant="outline"
        className="h-9 px-3"
        disabled={!classNo || busy}
        onClick={() => {
          onAdd(Number(classNo));
          setClassNo("");
        }}
      >
        추가
      </AppButton>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  small = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className={small ? "size-3.5" : "size-4"} aria-hidden />
    </button>
  );
}
