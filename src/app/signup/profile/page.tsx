"use client";

// 계정은 있는데 가입 정보가 없는 상태를 메우는 화면.
//
// 가입이 두 단계라 중간에 끊기면 Supabase 계정만 남는다.
// 로그인 직후 GET /student-profiles/me의 profile이 null이면 여기로 보낸다.
//
// 학교와 학번은 이미 로그인 계정(이메일)에 박혀 있다. 서버가 저장할 때 그 둘을 대조해서
// 다르면 SP004로 거절하므로, 화면에서도 계정에서 읽은 값을 그대로 쓰고 이름만 받는다.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { createStudentProfile, useFindSchools } from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatStudentNumber, parseStudentLoginEmail } from "@/lib/student-login";

export default function StudentProfilePage() {
  const router = useRouter();
  const schools = useFindSchools();

  const [account, setAccount] = useState<ReturnType<typeof parseStudentLoginEmail>>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await getSupabaseClient().auth.getSession();
      const email = data.session?.user.email;

      if (!email) {
        router.replace("/login");
        return;
      }

      const parsed = parseStudentLoginEmail(email);
      if (!parsed) {
        // 학생 규칙이 아닌 계정(교사 등)이 여기 올 일은 없다.
        router.replace("/login");
        return;
      }

      setAccount(parsed);
      setLoading(false);
    };

    void load();
  }, [router]);

  const schoolName = schools.data?.data?.find(
    (school) => school.id === account?.schoolId,
  )?.name;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account) return;

    setError(null);
    setSubmitting(true);

    try {
      await createStudentProfile({
        schoolId: account.schoolId,
        grade: account.grade,
        classNumber: account.classNumber,
        seatNumber: account.seatNumber,
        name: name.trim(),
      });

      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="학생"
      title="이름을 알려 주세요"
      description="선생님이 알아볼 수 있게 실명으로 적어 주세요."
    >
      {loading ? (
        <p className="text-muted-foreground">불러오는 중…</p>
      ) : (
        <form className="grid gap-5" onSubmit={onSubmit} noValidate>
          <div className="flex flex-wrap items-baseline gap-2.5 rounded-md bg-primary-soft px-4 py-3.5">
            <span className="text-sm text-muted-foreground">
              {schoolName ?? "내 학교"}
            </span>
            <b className="text-xl tracking-wide text-primary-deep tabular-nums">
              {account ? formatStudentNumber(account) : null}
            </b>
            <span className="text-sm text-muted-foreground">
              {account
                ? `${account.grade}학년 ${account.classNumber}반 ${account.seatNumber}번`
                : null}
            </span>
          </div>

          <AppField label="이름" htmlFor="name">
            <AppInput
              id="name"
              autoComplete="name"
              placeholder="예: 김하늘"
              maxLength={50}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </AppField>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <AppButton type="submit" block disabled={!name.trim() || submitting}>
            {submitting ? "저장하는 중…" : "저장하고 시작하기"}
          </AppButton>
        </form>
      )}
    </AuthShell>
  );
}
