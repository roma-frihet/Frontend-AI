"use client";

// 교사 마이페이지 — 내 정보만 둔다.
//
// 반 만들기·합류 코드는 학급 관리로 옮겼다. 수업 중에 쓰는 것이라 반 화면에 있어야 찾는다.

import { useState } from "react";
import Link from "next/link";
import { Pencil, UserRound } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { ErrorText, useRun } from "@/components/teacher/use-run";
import { Card } from "@/components/ui/card";
import { saveTeacherProfile, useFindMyPage } from "@/api/generated";

export default function TeacherMyPage() {
  const mypage = useFindMyPage();
  const profile = mypage.data?.data.profile;
  const { run, busy, error } = useRun();

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("");

  return (
    <TeacherShell title="마이페이지">
      <div className="grid max-w-lg gap-gap">
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
                void run(async () => {
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

        <ErrorText error={error} />
        <p className="text-sm text-muted-foreground">
          반 만들기와 합류 코드는{" "}
          <Link href="/teacher" className="font-bold text-primary-deep hover:underline">
            학급 관리
          </Link>
          로 옮겼습니다.
        </p>
      </div>
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
