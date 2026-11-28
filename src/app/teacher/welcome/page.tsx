"use client";

// 교사 첫 진입. 교사 계정은 따로 가입하지 않고 발급받으므로, 처음 들어오면 학교와 이름부터 받는다.
// 이 정보가 없으면 반을 만들 수 없다. 저장하면 학급 관리로 보낸다.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { SchoolPicker } from "@/components/auth/school-picker";
import { ErrorText, useRun } from "@/components/teacher/use-run";
import { useSignOut } from "@/components/teacher/use-sign-out";
import { getFindMyPageQueryKey, saveTeacherProfile, useFindMyPage } from "@/api/generated";
import { toId } from "@/lib/id";

export default function TeacherWelcomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mypage = useFindMyPage();
  const hasProfile = Boolean(mypage.data?.data.profile);

  const [schoolId, setSchoolId] = useState("");
  const [name, setName] = useState("");
  const { run, busy, error } = useRun();
  const { signOut, signingOut } = useSignOut();

  // 이미 정보를 넣은 교사가 주소로 들어오면 학급 관리로 돌려보낸다.
  useEffect(() => {
    if (hasProfile) router.replace("/teacher");
  }, [hasProfile, router]);

  const school = toId(schoolId);
  const ready = school != null && name.trim().length > 0;

  const submit = () =>
    run(async () => {
      await saveTeacherProfile({ schoolId: school, name: name.trim() });
      await queryClient.invalidateQueries({ queryKey: getFindMyPageQueryKey() });
    }).then((ok) => {
      if (ok) router.replace("/teacher");
    });

  return (
    <AuthShell
      badge="교사"
      title="처음 오셨군요"
      description="근무하는 학교와 이름을 알려 주세요. 바로 반을 만들 수 있습니다."
    >
      <form
        className="grid gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) void submit();
        }}
      >
        <AppField label="학교">
          <SchoolPicker value={schoolId} onChange={(id) => setSchoolId(id)} />
        </AppField>

        <AppField label="이름" htmlFor="teacher-name">
          <AppInput
            id="teacher-name"
            autoComplete="name"
            maxLength={50}
            placeholder="학생들에게 보일 이름"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </AppField>

        <ErrorText error={error} />

        <AppButton type="submit" block disabled={!ready || busy}>
          {busy ? "저장하는 중…" : "시작하기"}
        </AppButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        다른 계정으로 들어가야 하나요?{" "}
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          className="font-medium text-primary-deep hover:underline"
        >
          로그아웃
        </button>
      </p>
    </AuthShell>
  );
}
