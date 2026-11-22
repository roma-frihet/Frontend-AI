"use client";

// 합류 코드 — 수업 시작할 때 띄워 두는 용도다. 반 상세 머리에 붙는다.
//
// 승인 절차는 없다. 코드를 아는 사람은 그대로 들어온다. 대신 5분 뒤 만료되고,
// 다시 발급하면 이전 코드는 즉시 무효가 된다. 그래서 남은 시간을 함께 보여 준다.

import { useEffect, useState } from "react";

import { AppButton } from "@/components/app-button";
import { closeJoinCode, issueJoinCode } from "@/api/generated";
import type { ClassroomResponseResult } from "@/api/generated/model";

const TICK_MS = 1000;

const expiresAtMs = (expiresAt?: string | null) =>
  expiresAt ? new Date(expiresAt).getTime() : 0;

export function JoinCodeCard({
  classroom,
  busy,
  onRun,
}: {
  classroom: ClassroomResponseResult;
  busy: boolean;
  onRun: (task: () => Promise<unknown>) => void;
}) {
  // 남은 시간은 "지금"에서 계산한다. 상태로 들고 있으면 코드가 바뀔 때마다
  // 효과 안에서 다시 써 넣어야 해서 렌더가 겹친다.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(expiresAtMs(classroom.joinCodeExpiresAt) - now, 0);
  const live = Boolean(classroom.joinCode) && left > 0;
  const seconds = Math.max(Math.ceil(left / 1000), 0);
  const id = classroom.id ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
      <span className="text-sm font-bold text-muted-foreground">합류 코드</span>
      {live ? (
        <>
          <strong className="text-2xl font-extrabold tracking-widest text-primary-deep tabular-nums">
            {classroom.joinCode}
          </strong>
          <span className="text-sm text-muted-foreground tabular-nums">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} 남음
          </span>
          <AppButton
            variant="outline"
            className="h-9 px-3"
            disabled={busy}
            onClick={() => onRun(() => closeJoinCode(id))}
          >
            코드 끄기
          </AppButton>
        </>
      ) : (
        <AppButton
          className="h-9 px-3"
          disabled={busy}
          onClick={() => onRun(() => issueJoinCode(id))}
        >
          코드 발급
        </AppButton>
      )}
    </div>
  );
}
