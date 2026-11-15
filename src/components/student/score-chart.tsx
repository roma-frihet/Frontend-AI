// 목업의 "나의 변화" 꺾은선.
//
// 내 점수는 파란 실선 + 아래쪽 옅은 면, 반 평균은 연보라 점선이다.
// 연보라는 비교값 전용이라는 DESIGN.md 규칙과 같다.
//
// 목업은 눈금을 50~100으로 잡았지만 예시 데이터가 그 구간이었기 때문이다.
// 실제로는 0점도 나오므로 0~100으로 그린다. 그래야 낮은 점수가 잘리지 않는다.

import { useId } from "react";

import type { StudentReportResponseScore } from "@/api/generated/model";

const W = 640;
const H = 240;
const PAD = { left: 36, right: 16, top: 28, bottom: 30 };
const TICKS = [0, 25, 50, 75, 100];

/** 맞힌 문제 수를 100점 만점으로 바꾼다. 화면의 다른 숫자는 문제 수로 보여 준다. */
const toScore = (correct?: number | null, total?: number) =>
  correct == null || !total ? null : (correct / total) * 100;

export function ScoreChart({ scores }: { scores: StudentReportResponseScore[] }) {
  const gradientId = useId();

  // 미응시 차시는 점이 없다. 0점으로 그리면 거짓말이 된다.
  const points = scores.map((score) => ({
    label: `${score.lessonNumber}차시`,
    me: toScore(score.correctCount, score.questionCount),
    average: toScore(score.classAverageCorrect, score.questionCount),
  }));

  const n = points.length;
  if (n === 0) return null;

  const x = (i: number) =>
    PAD.left + (W - PAD.left - PAD.right) * (n > 1 ? i / (n - 1) : 0.5);
  const y = (value: number) =>
    PAD.top + (H - PAD.top - PAD.bottom) * (1 - value / 100);

  // 미응시한 차시는 점이 없다. 그 구간을 이어 그리면 풀지 않은 차시에 점수가
  // 있는 것처럼 보인다. 끊어서 여러 조각으로 그린다.
  const segments = (pick: (p: (typeof points)[number]) => number | null) => {
    const result: string[][] = [];
    let current: string[] = [];

    points.forEach((point, i) => {
      const value = pick(point);
      if (value == null) {
        if (current.length) result.push(current);
        current = [];
        return;
      }
      current.push(`${x(i)},${y(value)}`);
    });
    if (current.length) result.push(current);

    return result;
  };

  const mine = segments((point) => point.me);
  const average = segments((point) => point.average);

  // 마지막으로 푼 차시를 말풍선으로 짚어 준다.
  const lastIndex = points.reduce(
    (found, point, i) => (point.me != null ? i : found),
    -1,
  );
  const last = lastIndex >= 0 ? points[lastIndex] : undefined;

  return (
    <div className="grid gap-3">
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-primary" aria-hidden />
          내 점수
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-full bg-accent-strong"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, currentColor 0 6px, transparent 6px 11px)",
            }}
            aria-hidden
          />
          반 평균
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="차시별 내 점수와 반 평균 꺾은선 그래프"
        className="block h-auto w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fill="var(--muted-foreground)"
              fontSize="12"
            >
              {tick}
            </text>
          </g>
        ))}

        {mine.map((segment, i) => (
          <path
            key={`area-${i}`}
            d={`M${segment[0].split(",")[0]},${y(0)} L${segment.join(" L")} L${
              segment[segment.length - 1].split(",")[0]
            },${y(0)} Z`}
            fill={`url(#${gradientId})`}
          />
        ))}

        {average.map((segment, i) => (
          <polyline
            key={`avg-${i}`}
            points={segment.join(" ")}
            fill="none"
            stroke="var(--accent-strong)"
            strokeWidth="2"
            strokeDasharray="6 5"
          />
        ))}

        {mine.map((segment, i) => (
          <polyline
            key={`me-${i}`}
            points={segment.join(" ")}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}

        {points.map((point, i) => (
          <g key={point.label}>
            {point.average != null ? (
              <circle
                cx={x(i)}
                cy={y(point.average)}
                r="4"
                fill="var(--card)"
                stroke="var(--accent-strong)"
                strokeWidth="2"
              />
            ) : null}
            {point.me != null ? (
              <circle
                cx={x(i)}
                cy={y(point.me)}
                r="4.5"
                fill="var(--card)"
                stroke="var(--primary)"
                strokeWidth="2.5"
              />
            ) : null}
            <text
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fill="var(--muted-foreground)"
              fontSize="12"
            >
              {point.label}
            </text>
          </g>
        ))}

        {last?.me != null ? (
          <g transform={`translate(${x(lastIndex) - 34},${y(last.me) - 46})`}>
            <rect width="68" height="36" rx="8" fill="var(--primary)" />
            <text
              x="34"
              y="14"
              textAnchor="middle"
              fill="var(--primary-foreground)"
              fontSize="10"
            >
              {last.label}
            </text>
            <text
              x="34"
              y="29"
              textAnchor="middle"
              fill="var(--primary-foreground)"
              fontSize="13"
              fontWeight="700"
            >
              {Math.round(last.me)}점
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
