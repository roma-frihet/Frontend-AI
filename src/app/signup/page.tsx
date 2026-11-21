"use client";

// 학생 회원가입. 학교 → 학번과 이름 → 비밀번호 순으로 받는다.
//
// 가입은 두 단계다. Supabase에 계정을 만드는 것과, 우리 서버에 가입 정보를 저장하는 것은
// 별개 요청이다. 계정만 만들어지고 끊기면 로그인했을 때 profile이 null로 내려오므로,
// 그때는 /signup/profile에서 정보만 다시 받는다.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { SchoolPicker } from "@/components/auth/school-picker";
import { Stepper } from "@/components/auth/stepper";
import {
  StudentNumberFields,
  isStudentNumberFilled,
  type StudentNumberValue,
} from "@/components/auth/student-number-fields";
import { createStudentProfile } from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  MIN_PASSWORD_LENGTH,
  rememberLastSchool,
  toStudentLoginEmail,
} from "@/lib/student-login";

const STEPS = ["학교", "학번과 이름", "비밀번호"] as const;

// Supabase가 가입을 거절하는 이유는 여러 가지인데, 전부 "이미 가입된 학번"으로 뭉치면
// 학생도 선생님도 엉뚱한 곳을 고치게 된다. 실제로 설정 때문에 막힌 적이 있다.
const signUpMessage = (code?: string): string => {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 학번이에요. 번호를 확인하거나 로그인해 주세요.";
    case "weak_password":
      return `비밀번호가 너무 짧아요. ${MIN_PASSWORD_LENGTH}자 이상으로 다시 만들어 주세요.`;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "지금은 가입이 밀려 있어요. 잠시 뒤에 다시 눌러 주세요.";
    default:
      // 학번·비밀번호를 고쳐도 풀리지 않는 종류다. 학생이 혼자 해결할 수 없으니 그렇게 말한다.
      return "지금은 가입할 수 없어요. 선생님께 말씀해 주세요.";
  }
};

export default function StudentSignupPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [profile, setProfile] = useState<StudentNumberValue>({
    grade: "",
    classNumber: "",
    seatNumber: "",
    name: "",
  });
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canGoNext =
    step === 1
      ? Boolean(schoolId)
      : step === 2
        ? isStudentNumberFilled(profile)
        : password.length >= MIN_PASSWORD_LENGTH && !submitting;

  const signUp = async () => {
    const email = toStudentLoginEmail({
      schoolId: Number(schoolId),
      grade: Number(profile.grade),
      classNumber: Number(profile.classNumber),
      seatNumber: Number(profile.seatNumber),
    });

    const supabase = getSupabaseClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      // 원인 코드는 화면에 쓰지 않지만, 남겨 두지 않으면 설정 문제를 추적할 길이 없다.
      console.error("signUp 실패", signUpError.code, signUpError.message);
      setError(signUpMessage(signUpError.code));
      return;
    }

    // 계정이 생겼으니 토큰이 붙는다. 이제 서버에 가입 정보를 저장한다.
    await createStudentProfile({
      schoolId: Number(schoolId),
      grade: Number(profile.grade),
      classNumber: Number(profile.classNumber),
      seatNumber: Number(profile.seatNumber),
      name: profile.name.trim(),
    });

    rememberLastSchool(schoolId);
    router.replace("/");
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (password !== passwordAgain) {
      setError("비밀번호가 서로 달라요.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "가입하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="학생"
      title="학생 회원가입"
      description="학교와 학번을 고르면 아이디가 자동으로 만들어져요."
    >
      <Stepper steps={STEPS} current={step} />

      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        {step === 1 ? (
          <SchoolPicker
            value={schoolId}
            onChange={(id, name) => {
              setSchoolId(id);
              setSchoolName(name);
            }}
          />
        ) : null}

        {step === 2 ? (
          <StudentNumberFields value={profile} onChange={setProfile} />
        ) : null}

        {step === 3 ? (
          <>
            <div className="grid gap-1 rounded-md bg-primary-soft px-4 py-3.5">
              <span className="text-sm text-muted-foreground">
                로그인할 때는 학교, 학번, 비밀번호를 써요
              </span>
              <b className="text-primary-deep">
                {`${schoolName} ${profile.grade}학년 ${profile.classNumber}반 ${profile.seatNumber}번 ${profile.name}`}
              </b>
            </div>
            <AppField label="비밀번호" htmlFor="password">
              <AppInput
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </AppField>
            <AppField label="비밀번호 확인" htmlFor="password-again">
              <AppInput
                id="password-again"
                type="password"
                autoComplete="new-password"
                placeholder="한 번 더 입력"
                value={passwordAgain}
                onChange={(event) => setPasswordAgain(event.target.value)}
              />
            </AppField>
            <p className="text-sm text-muted-foreground">
              가입한 뒤 선생님께 받은 수업 코드를 입력하면 그 수업에 연결돼요.
            </p>
          </>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2.5">
          {step > 1 ? (
            <AppButton
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                setStep(step - 1);
              }}
            >
              이전
            </AppButton>
          ) : null}
          <AppButton type="submit" disabled={!canGoNext}>
            {step < 3 ? "다음" : submitting ? "가입하는 중…" : "가입하기"}
          </AppButton>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-primary-deep hover:underline">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
