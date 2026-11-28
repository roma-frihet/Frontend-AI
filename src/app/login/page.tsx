"use client";

// 학생 로그인. 학교 + 학번(학년·반·번호) + 비밀번호로 들어온다.
//
// 로그인 자체는 Supabase Auth가 하고, 우리 서버는 토큰만 받는다.
// 로그인 직후 가입 정보가 비어 있으면(profile === null) 가입 정보 화면으로 보내야 한다.
// 임시 비밀번호로 들어온 경우(mustChangePassword)는 비밀번호 변경 화면으로 보낸다.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/app-button";
import { AppField, AppInput } from "@/components/app-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { AppSelect } from "@/components/app-select";
import { findMyStudentProfile, useFindSchools } from "@/api/generated";
import { ApiError } from "@/lib/api-fetcher";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  STUDENT_CLASS_NUMBER_MAX,
  STUDENT_GRADE_MAX,
  STUDENT_SEAT_NUMBER_MAX,
  rememberLastSchool,
  toStudentLoginEmail,
} from "@/lib/student-login";

// "3" 대신 "3학년"처럼 단위를 붙여 보여 준다.
const numberItems = (max: number, unit: string) =>
  Array.from({ length: max }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}${unit}`,
  }));

const GRADE_ITEMS = numberItems(STUDENT_GRADE_MAX, "학년");
const CLASS_ITEMS = numberItems(STUDENT_CLASS_NUMBER_MAX, "반");
const SEAT_ITEMS = numberItems(STUDENT_SEAT_NUMBER_MAX, "번");

export default function StudentLoginPage() {
  const router = useRouter();
  const schools = useFindSchools();

  const [schoolId, setSchoolId] = useState("");
  const [grade, setGrade] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schoolItems = (schools.data?.data ?? []).map((school) => ({
    value: String(school.id),
    label: school.name ?? "",
  }));
  const canSubmit =
    schoolId && grade && classNumber && seatNumber && password && !submitting;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const email = toStudentLoginEmail({
        schoolId: Number(schoolId),
        grade: Number(grade),
        classNumber: Number(classNumber),
        seatNumber: Number(seatNumber),
      });

      const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Supabase는 계정 없음과 비밀번호 틀림을 구분해 주지 않는다. 학생에게도 그렇게 보여 준다.
        setError("학번이나 비밀번호가 맞지 않아요.");
        return;
      }

      rememberLastSchool(schoolId);

      // 가입이 2단계라, 계정만 있고 가입 정보가 없는 상태가 있을 수 있다.
      const { data: profile } = await findMyStudentProfile();

      if (!profile.profile) {
        router.replace("/signup/profile");
        return;
      }
      if (profile.profile.mustChangePassword) {
        router.replace("/password");
        return;
      }

      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      badge="학생"
      title="로그인"
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <AppField label="학교" htmlFor="school">
          <AppSelect
            id="school"
            items={schoolItems}
            value={schoolId}
            onValueChange={setSchoolId}
            placeholder={schools.isPending ? "불러오는 중…" : "학교를 고르세요"}
            disabled={schools.isPending}
          />
        </AppField>

        <div className="grid grid-cols-3 gap-2">
          <AppField label="학년" htmlFor="grade">
            <AppSelect
              id="grade"
              items={GRADE_ITEMS}
              value={grade}
              onValueChange={setGrade}
              placeholder="학년"
            />
          </AppField>
          <AppField label="반" htmlFor="class">
            <AppSelect
              id="class"
              items={CLASS_ITEMS}
              value={classNumber}
              onValueChange={setClassNumber}
              placeholder="반"
            />
          </AppField>
          <AppField label="번호" htmlFor="seat">
            <AppSelect
              id="seat"
              items={SEAT_ITEMS}
              value={seatNumber}
              onValueChange={setSeatNumber}
              placeholder="번호"
            />
          </AppField>
        </div>

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

        <AppButton type="submit" block disabled={!canSubmit}>
          {submitting ? "로그인하는 중…" : "로그인"}
        </AppButton>

        <p className="text-center text-sm text-muted-foreground">
          비밀번호를 잊어버렸나요? 선생님께 말씀해 주세요.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        계정이 없나요?{" "}
        <Link href="/signup" className="font-medium text-primary-deep hover:underline">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}
