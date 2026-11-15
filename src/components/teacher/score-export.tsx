"use client";

// 수업 전체 점수를 CSV로 내려받는다.
//
// 서버가 페이지로 주므로 끝까지 받아서 한 파일로 만든다.
// 미응시는 0점이 아니다. 서버가 null로 구분해 주니 빈 칸으로 둬서 구분을 지킨다.

import { useState } from "react";
import { Download } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { findScores } from "@/api/generated";
import type { ReportResponseStudentScore } from "@/api/generated/model";
import { ApiError } from "@/lib/api-fetcher";

const PAGE_SIZE = 100;
const HEADER = ["반", "학번", "이름", "차시", "맞힌 문제", "총 문제"];

/** 쉼표·따옴표·줄바꿈이 들어가도 깨지지 않게 감싼다. */
const cell = (value: string | number | null | undefined) => {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (rows: ReportResponseStudentScore[]) =>
  [
    HEADER.join(","),
    ...rows.map((row) =>
      [
        `${row.classNo}반`,
        row.studentNumber,
        row.studentName,
        `${row.lessonNumber}차시`,
        row.correctCount,
        row.questionCount,
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\n");

export function ScoreExport({
  courseId,
  label,
}: {
  courseId: number;
  /** 파일 이름에 쓸 수업 이름 */
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setError(null);
    setBusy(true);

    try {
      const rows: ReportResponseStudentScore[] = [];
      for (let page = 0; ; page += 1) {
        const { data } = await findScores(courseId, { page, size: PAGE_SIZE });
        rows.push(...(data.content ?? []));
        if (!data.pageInfo?.hasNext) break;
      }

      if (rows.length === 0) {
        setError("내려받을 기록이 아직 없습니다.");
        return;
      }

      // 엑셀이 한글을 깨뜨리지 않도록 BOM을 붙인다.
      const blob = new Blob([`﻿${toCsv(rows)}`], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${label} 점수.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "내려받지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid justify-items-end gap-1">
      <AppButton variant="outline" disabled={busy} onClick={download}>
        <Download className="size-4" aria-hidden />
        {busy ? "만드는 중…" : "점수 내려받기"}
      </AppButton>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
