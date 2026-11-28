"use client";

// 열기 예약 / 자동 마감 고르기.
//
// 예약은 대개 같은 날 수업 시간에 쓴다. 그래서 날짜는 "오늘"을 먼저 보여 주고 다른 날은 목록으로 둔다.
// 시각은 시·분을 따로 고른다(분은 5분 단위). 마감은 시각을 또 고르게 하지 않고 "열고 나서 몇 분 뒤"로
// 정한다. 자주 쓰는 길이는 칩으로, 그 밖의 길이는 직접 입력한다.
// 이미 열린 차시는 마감만 정하며, 그때는 "지금부터 몇 분 뒤"다.

import { useEffect, useState } from "react";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AppSelect } from "@/components/app-select";
import { Callout } from "@/components/surface";
import { ToggleChip } from "@/components/text-action";
import { toLocalInput, toOffsetDateTime } from "@/components/teacher/lesson-status";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const DAY_COUNT = 14;
const DURATIONS = [5, 10, 15, 30] as const;
const MAX_CUSTOM_MINUTES = 24 * 60;
const MINUTE_STEP = 5;

const startOfDay = (offset: number, now: number) => {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const dateLabel = (offset: number, now: number) => {
  const date = startOfDay(offset, now);
  const weekday = date.toLocaleDateString("ko-KR", { weekday: "short" });
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
};

const dayLabel = (offset: number, now: number) => {
  if (offset === 0) return "오늘";
  if (offset === 1) return "내일";
  return dateLabel(offset, now);
};

const hourLabel = (hour: number) => {
  if (hour === 0) return "오전 12시";
  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return "오후 12시";
  return `오후 ${hour - 12}시`;
};

const timeLabel = (date: Date) =>
  date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });

const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${minutes}분 뒤`;
  return rest === 0 ? `${hours}시간 뒤` : `${hours}시간 ${rest}분 뒤`;
};

const HOUR_ITEMS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: hourLabel(hour),
}));
const MINUTE_ITEMS = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => ({
  value: String(i * MINUTE_STEP),
  label: `${String(i * MINUTE_STEP).padStart(2, "0")}분`,
}));
const laterDayItems = (now: number) =>
  Array.from({ length: DAY_COUNT - 1 }, (_, i) => ({
    value: String(i + 1),
    label: i === 0 ? `내일, ${dateLabel(1, now)}` : dateLabel(i + 1, now),
  }));

/** 지금부터 10분 뒤를 5분 단위로 올린 시각. 처음 열었을 때 고를 필요가 없게 한다. */
const defaultOpen = (now: number) => {
  const date = new Date(now + 10 * MINUTE_MS);
  const minutes = Math.ceil(date.getMinutes() / MINUTE_STEP) * MINUTE_STEP;
  date.setMinutes(minutes, 0, 0);
  const day = Math.round((new Date(date).setHours(0, 0, 0, 0) - startOfDay(0, now).getTime()) / DAY_MS);
  return { day, hour: date.getHours(), minute: date.getMinutes() };
};

export function SchedulePicker({
  isOpen,
  busy,
  onCancel,
  onSave,
}: {
  /** 이미 열린 차시는 마감만 정한다. */
  isOpen: boolean;
  busy: boolean;
  onCancel: () => void;
  onSave: (openAt: string | null, finishAt: string | null) => void;
}) {
  // 렌더 중에 시계를 읽지 않는다. 지금 시각은 상태로 들고 30초마다 맞춘다.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);
  const [initial] = useState(() => defaultOpen(now));
  const [day, setDay] = useState(initial.day);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  /** null은 자동 마감 안 함, "custom"은 직접 입력. */
  const [choice, setChoice] = useState<number | "custom" | null>(isOpen ? DURATIONS[0] : null);
  const [customMinutes, setCustomMinutes] = useState("");

  const custom = Number(customMinutes);
  const customValid = Number.isInteger(custom) && custom >= 1 && custom <= MAX_CUSTOM_MINUTES;
  const duration = choice === "custom" ? (customValid ? custom : null) : choice;
  const needsCustom = choice === "custom" && !customValid;

  const openDate = new Date(startOfDay(day, now).getTime() + (hour * 60 + minute) * MINUTE_MS);
  const base = isOpen ? new Date(now) : openDate;
  const finishDate = duration == null ? null : new Date(base.getTime() + duration * MINUTE_MS);
  const past = !isOpen && openDate.getTime() <= now;

  const summary = needsCustom
    ? `몇 분 뒤에 마감할지 1분에서 ${MAX_CUSTOM_MINUTES}분 사이로 적어 주세요.`
    : isOpen
    ? `${timeLabel(finishDate ?? base)}에 자동으로 마감해요.`
    : `${dayLabel(day, now)} ${timeLabel(openDate)}에 열어요.` +
      (finishDate ? ` ${durationLabel(duration ?? 0)}인 ${timeLabel(finishDate)}에 자동으로 마감해요.` : "");

  return (
    <form
      className="grid gap-4 rounded-md bg-secondary p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (past || needsCustom) return;
        onSave(
          isOpen ? null : toOffsetDateTime(toLocalInput(openDate)),
          finishDate ? toOffsetDateTime(toLocalInput(finishDate)) : null,
        );
      }}
    >
      {isOpen ? null : (
        <div className="grid gap-3">
          <strong>언제 열까요?</strong>
          <div role="group" aria-label="여는 날" className="flex flex-wrap items-center gap-2">
            <ToggleChip pressed={day === 0} onClick={() => setDay(0)}>
              오늘
            </ToggleChip>
            <AppSelect
              id="schedule-later-day"
              items={laterDayItems(now)}
              value={day >= 1 ? String(day) : ""}
              onValueChange={(value) => value && setDay(Number(value))}
              placeholder="다른 날"
              className="w-auto min-w-36 bg-card"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <AppField label="시" htmlFor="schedule-hour">
              <AppSelect
                id="schedule-hour"
                items={HOUR_ITEMS}
                value={String(hour)}
                onValueChange={(value) => setHour(Number(value))}
                placeholder="시"
                className="w-32 bg-card"
              />
            </AppField>
            <AppField label="분" htmlFor="schedule-minute">
              <AppSelect
                id="schedule-minute"
                items={MINUTE_ITEMS}
                value={String(minute)}
                onValueChange={(value) => setMinute(Number(value))}
                placeholder="분"
                className="w-28 bg-card"
              />
            </AppField>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <strong>{isOpen ? "언제 마감할까요?" : "자동으로 마감할까요?"}</strong>
        <div role="group" aria-label="자동 마감" className="flex flex-wrap gap-2">
          {isOpen ? null : (
            <ToggleChip pressed={choice == null} onClick={() => setChoice(null)}>
              안 함
            </ToggleChip>
          )}
          {DURATIONS.map((minutes) => (
            <ToggleChip
              key={minutes}
              pressed={choice === minutes}
              onClick={() => setChoice(minutes)}
            >
              {isOpen ? `지금부터 ${durationLabel(minutes)}` : `열고 ${durationLabel(minutes)}`}
            </ToggleChip>
          ))}
          <ToggleChip pressed={choice === "custom"} onClick={() => setChoice("custom")}>
            직접 입력
          </ToggleChip>
        </div>
        {choice === "custom" ? (
          <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {isOpen ? "지금부터" : "열고"}
            <AppInput
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_CUSTOM_MINUTES}
              autoFocus
              aria-label="마감까지 몇 분"
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
              className="w-24 bg-card text-right"
            />
            분 뒤에 마감
          </label>
        ) : null}
      </div>

      <Callout tone={past ? "danger" : "primary"} role="status" className="text-sm font-medium">
        {past ? "이미 지난 시각이에요. 다른 시각을 골라 주세요." : summary}
      </Callout>

      <div className="flex flex-wrap gap-2">
        <AppButton type="submit" disabled={busy || past || needsCustom}>
          예약하기
        </AppButton>
        <AppButton type="button" variant="outline" onClick={onCancel}>
          취소
        </AppButton>
      </div>
    </form>
  );
}
