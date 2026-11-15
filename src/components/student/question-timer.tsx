"use client";

// 문제 제한 시간을 세는 막대.
//
// 남은 시간은 서버가 remainingMillis로 알려 준다. 기기 시계를 믿지 않는다.
// 받은 순간을 기준으로 마감 시각을 잡고 거기서부터 줄여 나간다.
//
// 문제가 바뀌면 부모가 key로 다시 붙인다. 그래야 마감 시각이 새로 잡힌다.

import { useEffect, useRef, useState } from "react";

import { cn } from "cn";

const TICK_MS = 200;
const HURRY_SEC = 10;

export function QuestionTimer({
  remainingMillis,
  totalSec,
  onExpire,
}: {
  remainingMillis: number;
  totalSec: number;
  /** 0이 되면 한 번만 부른다. 서버가 임시 저장된 답으로 확정해 준다. */
  onExpire: () => void;
}) {
  const [deadline] = useState(() => Date.now() + remainingMillis);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(deadline - now, 0);

  const expired = useRef(false);
  useEffect(() => {
    if (left === 0 && !expired.current) {
      expired.current = true;
      onExpire();
    }
  }, [left, onExpire]);

  const seconds = Math.ceil(left / 1000);
  const ratio = totalSec > 0 ? left / (totalSec * 1000) : 0;
  const hurry = seconds <= HURRY_SEC;

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold text-muted-foreground">남은 시간</span>
        <span
          aria-live="polite"
          className={cn(
            "text-xl font-extrabold tabular-nums",
            hurry ? "text-destructive" : "text-foreground",
          )}
        >
          {seconds}초
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
        <span
          className={cn(
            "block h-full rounded-full transition-[width] duration-200 ease-linear",
            hurry ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
        />
      </div>
    </div>
  );
}
