"use client";

// 임시 비밀번호로 들어왔을 때 새 비밀번호를 정하는 화면.
//
// 선생님이 비밀번호를 초기화하면 GET /student-profiles/me의 mustChangePassword가 true가 된다.
// 로그인 직후 그 값을 보고 여기로 보낸다. 바꾸면 서버가 알아서 플래그를 내린다.

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { changeMyPassword } from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";
import { MIN_PASSWORD_LENGTH } from "@/lib/student-login";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordAgain) {
      setError("비밀번호가 서로 달라요.");
      return;
    }

    setSubmitting(true);
    try {
      await changeMyPassword({ password });
      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "비밀번호를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="학생"
      title="새 비밀번호를 정해 주세요"
      description="안전을 위해 새 비밀번호를 정해 주세요."
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <AppField label="새 비밀번호" htmlFor="password">
          <AppInput
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </AppField>
        <AppField label="새 비밀번호 확인" htmlFor="password-again">
          <AppInput
            id="password-again"
            type="password"
            autoComplete="new-password"
            placeholder="한 번 더 입력"
            value={passwordAgain}
            onChange={(event) => setPasswordAgain(event.target.value)}
          />
        </AppField>

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <AppButton
          type="submit"
          block
          disabled={password.length < MIN_PASSWORD_LENGTH || submitting}
        >
          {submitting ? "바꾸는 중…" : "비밀번호 바꾸고 시작하기"}
        </AppButton>
      </form>
    </AuthShell>
  );
}
