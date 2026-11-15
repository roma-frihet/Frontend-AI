"use client";

// 교사 로그인. 학생과 달리 이메일로 들어온다.
//
// 로그인 자체는 Supabase Auth가 한다. 교사인지는 토큰의 app_metadata.role로 갈리고,
// 서버도 같은 값으로 /api/v1/teacher/** 접근을 막는다.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSupabaseClient, isTeacherSession } from "@/lib/supabase/client";

export default function TeacherLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("이메일이나 비밀번호가 맞지 않습니다.");
        return;
      }

      // 학생 계정으로 교사 화면에 들어오면 서버가 전부 막는다. 여기서 먼저 막아 준다.
      if (!isTeacherSession(data.session)) {
        await supabase.auth.signOut();
        setError("교사 계정이 아닙니다. 학생이라면 학생 로그인을 이용하세요.");
        return;
      }

      router.replace("/teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="교사"
      title="로그인"
      description="이메일과 비밀번호로 로그인합니다."
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <AppField label="이메일" htmlFor="email">
          <AppInput
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </AppField>
        <AppField label="비밀번호" htmlFor="password">
          <AppInput
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </AppField>

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <AppButton type="submit" block disabled={!email || !password || submitting}>
          {submitting ? "로그인하는 중…" : "로그인"}
        </AppButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        학생인가요?{" "}
        <Link href="/login" className="font-medium text-primary-deep hover:underline">
          학생 로그인
        </Link>
      </p>
    </AuthShell>
  );
}
