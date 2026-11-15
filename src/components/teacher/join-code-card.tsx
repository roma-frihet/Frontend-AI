"use client";

// 합류 코드 — 수업 시작할 때 띄워 두는 용도다.
//
// 승인 절차는 없다. 코드를 아는 사람은 그대로 들어온다. 대신 5분 뒤 만료되고,
// 다시 발급하면 이전 코드는 즉시 무효가 된다. 그래서 남은 시간을 크게 보여 준다.

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { Card } from "@/components/ui/card";
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
    <Card className="grid gap-4 rounded-lg border border-border p-6 shadow-card ring-0">
      <div className="flex items-center gap-2.5">
        <KeyRound className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-bold">수업 코드</h2>
      </div>

      {live ? (
        <div className="flex flex-wrap items-center gap-4">
          <span className="rounded-lg bg-primary-soft px-6 py-3 text-3xl font-extrabold tracking-[0.2em] text-primary-deep tabular-nums">
            {classroom.joinCode}
          </span>
          <span className="grid gap-0.5">
            <span className="text-sm text-muted-foreground">남은 시간</span>
            <span className="text-xl font-bold tabular-nums">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </span>
          <AppButton
            variant="outline"
            className="ml-auto"
            disabled={busy}
            onClick={() => onRun(() => closeJoinCode(id))}
          >
            코드 끄기
          </AppButton>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground">
            코드를 발급하면 5분 동안 쓸 수 있습니다. 학생이 홈에서 입력하면 바로
            연결됩니다.
          </p>
          <AppButton disabled={busy} onClick={() => onRun(() => issueJoinCode(id))}>
            코드 발급
          </AppButton>
        </div>
      )}
    </Card>
  );
}
