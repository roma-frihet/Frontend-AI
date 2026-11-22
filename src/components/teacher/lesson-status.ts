// 반에서 본 차시 상태. 여러 화면이 같은 말과 같은 색을 쓴다.
//
//   안 열림(PLANNED) → 열림(OPEN) ⇄ 닫힘(CLOSED) → 마감(FINISHED)

export type LessonStatus = "PLANNED" | "OPEN" | "CLOSED" | "FINISHED";

export const STATUS_LABEL: Record<LessonStatus, string> = {
  PLANNED: "열기 전",
  OPEN: "진행 중",
  CLOSED: "닫힘",
  FINISHED: "마감",
};

export const STATUS_TONE: Record<LessonStatus, string> = {
  PLANNED: "bg-secondary text-muted-foreground",
  OPEN: "bg-success-soft text-success",
  CLOSED: "bg-warning-soft text-foreground",
  FINISHED: "bg-primary-soft text-primary-deep",
};

/** 정답률이 이 아래면 다시 짚어 볼 문제로 표시한다. */
export const LOW_RATE = 0.5;

export const percent = (right: number, total: number) =>
  total > 0 ? Math.round((right * 100) / total) : null;

/**
 * 서버에 보낼 시각. 시간대를 꼭 붙인다(서버 시계가 UTC라 없으면 9시간 어긋난다).
 * `2026-11-23T09:10` 같은 datetime-local 값을 받아 `2026-11-23T09:10:00+09:00`으로 만든다.
 */
export const toOffsetDateTime = (local: string) => {
  const date = new Date(local);
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");
  return `${local.length === 16 ? `${local}:00` : local}${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
};

/** datetime-local 입력에 넣을 값(기기 시간대 기준). */
export const toLocalInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** 예약 시각을 사람이 읽는 말로. 오늘이면 날짜를 뺀다. */
export const formatSchedule = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const time = date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
  return date.toDateString() === today.toDateString()
    ? `오늘 ${time}`
    : `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
};
