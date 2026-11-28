"use client";

// 성적 탭 — 이 반에서 연 차시마다 제출 수, 반 평균, 같은 수업 전체 평균.
//
// 숫자는 question-stats에서 센다. 한 차시를 모든 반으로 한 번 부르면 이 반과 수업 전체를 함께 얻는다.
// 평균은 "응답한 학생 1명이 평균 몇 문제를 맞혔나"이다. 미응시는 0점이 아니라 빠진다.

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppSelect } from "@/components/app-select";
import { statusIn } from "@/components/teacher/classroom/lessons-tab";
import { TableBox, td, th } from "@/components/teacher/panel";
import { ErrorText } from "@/components/states";
import { Callout, Panel } from "@/components/surface";
import { exportScores, getFindQuestionStatsQueryOptions } from "@/api/generated";
import type {
  ClassroomResponseResult,
  ExportScoresSheet,
  LessonResponseResult,
  QuestionStatsResponseClassroom,
} from "@/api/generated/model";
import { ApiError } from "@/lib/api-fetcher";
import { cn } from "cn";

const averageOf = (rooms: QuestionStatsResponseClassroom[]) => {
  const responders = rooms.reduce((sum, room) => sum + (room.responseCount ?? 0), 0);
  const right = rooms.reduce(
    (sum, room) =>
      sum + (room.questions ?? []).reduce((acc, item) => acc + (item.rightCount ?? 0), 0),
    0,
  );
  return responders ? right / responders : null;
};

export function ScoresTab({
  classroom,
  courseLabel,
  lessons,
  onStudents,
}: {
  classroom: ClassroomResponseResult;
  courseLabel: string;
  lessons: LessonResponseResult[];
  onStudents: (lessonNumber: number) => void;
}) {
  const classroomId = classroom.id ?? 0;
  const courseId = classroom.courseId ?? 0;
  const opened = lessons.filter((lesson) => {
    const status = statusIn(lesson, classroomId)?.status;
    return status && status !== "PLANNED";
  });

  const results = useQueries({
    queries: opened.map((lesson) =>
      getFindQuestionStatsQueryOptions(courseId, lesson.lessonNumber ?? 0),
    ),
  });

  const [exportOpen, setExportOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground">이 반에서 연 차시의 결과예요.</span>
        <AppButton
          variant="outline"
          aria-expanded={exportOpen}
          onClick={() => setExportOpen(!exportOpen)}
        >
          <Download className="size-4" aria-hidden />
          엑셀로 내보내기
        </AppButton>
      </div>

      {exportOpen ? (
        <ExportPanel
          courseId={courseId}
          classroomId={classroomId}
          classLabel={`${classroom.classNo}반`}
          courseLabel={courseLabel}
          lessons={opened}
        />
      ) : null}

      {opened.length === 0 ? (
        <Panel>
          <p className="text-muted-foreground">
            아직 이 반에서 연 차시가 없어요. 수업 진행에서 차시를 열면 여기에 결과가 모여요.
          </p>
        </Panel>
      ) : (
        <TableBox label="차시별 결과">
          <thead>
            <tr>
              <th scope="col" className={th}>차시</th>
              <th scope="col" className={th}>제출</th>
              <th scope="col" className={th}>반 평균</th>
              <th scope="col" className={th}>{courseLabel} 전체 평균</th>
              <th scope="col" className={th}>
                <span className="sr-only">학생별 보기</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {opened.map((lesson, index) => {
              const rooms = results[index]?.data?.data ?? [];
              const mine = rooms.find((room) => room.classroomId === classroomId);
              const all = rooms.filter((room) => room.status !== "PLANNED");
              const questionCount = mine?.questions?.length ?? lesson.questionCount ?? 0;
              const classAvg = mine ? averageOf([mine]) : null;
              const courseAvg = averageOf(all);
              return (
                <tr key={lesson.lessonNumber}>
                  <td className={td}>
                    {lesson.lessonNumber}차시 · {lesson.title}
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {mine ? `${mine.responseCount ?? 0} / ${mine.studentCount ?? 0}명` : "–"}
                  </td>
                  <td className={`${td} font-bold tabular-nums`}>
                    {classAvg == null ? "–" : `${classAvg.toFixed(1)} / ${questionCount}`}
                  </td>
                  <td className={`${td} text-accent-deep tabular-nums`}>
                    {courseAvg == null ? "–" : `${courseAvg.toFixed(1)} / ${questionCount}`}
                  </td>
                  <td className={td}>
                    <AppButton
                      variant="outline"
                      className="h-9 px-3"
                      onClick={() => onStudents(lesson.lessonNumber ?? 0)}
                    >
                      학생별 보기
                    </AppButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableBox>
      )}
    </>
  );
}

const SHEETS: { value: ExportScoresSheet; label: string; needsLesson: boolean }[] = [
  { value: "STUDENT_SCORES", label: "학생별 차시 점수", needsLesson: false },
  { value: "QUESTION_RATES", label: "문제별 정답률", needsLesson: true },
  { value: "ANSWER_SHEET", label: "학생별 문제 정오표", needsLesson: true },
];

/** `attachment; filename*=UTF-8''2%ED%95%99%EB%85%84.csv`에서 파일 이름을 꺼낸다. */
const filenameOf = (headers: Headers, fallback: string) => {
  const header = headers.get("content-disposition") ?? "";
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim().replace(/^"|"$/g, ""));
    } catch {
      // 잘못 인코딩된 이름이면 아래 이름을 쓴다.
    }
  }
  return /filename="?([^";]+)"?/i.exec(header)?.[1] ?? fallback;
};

/** 서버가 보낸 파일을 그대로 저장한다. CSV 앞의 BOM(엑셀 한글용)도 서버가 붙여 보낸 그대로다. */
const save = (file: Blob, filename: string) => {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function ExportPanel({
  courseId,
  classroomId,
  classLabel,
  courseLabel,
  lessons,
}: {
  courseId: number;
  classroomId: number;
  classLabel: string;
  courseLabel: string;
  lessons: LessonResponseResult[];
}) {
  const [scope, setScope] = useState<"classroom" | "course">("classroom");
  const [sheets, setSheets] = useState<ExportScoresSheet[]>(["STUDENT_SCORES"]);
  const [lesson, setLesson] = useState(String(lessons.at(-1)?.lessonNumber ?? ""));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const needsLesson = sheets.some((sheet) => SHEETS.find((s) => s.value === sheet)?.needsLesson);
  const ready = sheets.length > 0 && (!needsLesson || Boolean(lesson));

  const download = async () => {
    setError(null);
    setDone([]);
    setBusy(true);
    try {
      const names: string[] = [];
      // 시트마다 파일이 하나씩 온다.
      for (const sheet of sheets) {
        const needs = SHEETS.find((s) => s.value === sheet)?.needsLesson;
        const response = await exportScores(courseId, {
          sheet,
          classroomId: scope === "classroom" ? classroomId : undefined,
          lessonNumber: needs ? Number(lesson) : undefined,
        });
        const name = filenameOf(response.headers, `${courseLabel} ${sheet}.csv`);
        save(response.data, name);
        names.push(name);
      }
      setDone(names);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "내려받지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="bg-primary-soft">
      <div className="grid gap-2">
        <strong>내보낼 범위</strong>
        <div role="radiogroup" aria-label="내보낼 범위" className="flex flex-wrap gap-2">
          {(
            [
              ["classroom", `${classLabel}만`],
              ["course", `${courseLabel} 전체 반`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={scope === value}
              onClick={() => setScope(value)}
              className={cn(
                "min-h-10 rounded-md border bg-card px-4 text-sm font-bold",
                scope === value ? "border-primary text-primary-deep" : "border-border text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 font-bold">시트</legend>
        {SHEETS.map((sheet) => (
          <label key={sheet.value} className="flex min-h-8 items-center gap-2.5">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={sheets.includes(sheet.value)}
              onChange={(event) =>
                setSheets(
                  event.target.checked
                    ? [...sheets, sheet.value]
                    : sheets.filter((value) => value !== sheet.value),
                )
              }
            />
            {sheet.label}
            {sheet.needsLesson ? (
              <span className="text-sm text-muted-foreground">(차시 하나)</span>
            ) : null}
          </label>
        ))}
      </fieldset>

      {needsLesson ? (
        <label className="grid max-w-xs gap-1.5 text-sm font-bold">
          차시
          <AppSelect
            items={lessons.map((item) => ({
              value: String(item.lessonNumber),
              label: `${item.lessonNumber}차시 · ${item.title}`,
            }))}
            value={lesson}
            onValueChange={setLesson}
            placeholder="차시 선택"
            className="bg-card"
          />
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <AppButton disabled={!ready || busy} onClick={() => void download()}>
          {busy ? "만드는 중…" : "내려받기"}
        </AppButton>
        <span className="text-sm text-muted-foreground">엑셀에서 바로 열 수 있어요.</span>
      </div>
      {done.length ? (
        <Callout tone="success" role="status" className="text-sm font-bold">
          {done.join(", ")} 파일을 만들었어요.
        </Callout>
      ) : null}
      <ErrorText error={error} />
    </Panel>
  );
}
