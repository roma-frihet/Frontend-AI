"use client";

// 학번(학년·반·번호)과 이름을 받는 묶음.
// 회원가입과 "가입 정보만 따로 저장"하는 화면이 같은 입력을 쓴다.

import { AppField, AppInput } from "@/components/app-field";
import { AppSelect } from "@/components/app-select";
import {
  STUDENT_CLASS_NUMBER_MAX,
  STUDENT_GRADE_MAX,
  STUDENT_SEAT_NUMBER_MAX,
  formatStudentNumber,
} from "@/lib/student-login";

const numberItems = (max: number, unit: string) =>
  Array.from({ length: max }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}${unit}`,
  }));

const GRADE_ITEMS = numberItems(STUDENT_GRADE_MAX, "학년");
const CLASS_ITEMS = numberItems(STUDENT_CLASS_NUMBER_MAX, "반");
const SEAT_ITEMS = numberItems(STUDENT_SEAT_NUMBER_MAX, "번");

export type StudentNumberValue = {
  grade: string;
  classNumber: string;
  seatNumber: string;
  name: string;
};

export const isStudentNumberFilled = (value: StudentNumberValue) =>
  Boolean(value.grade && value.classNumber && value.seatNumber && value.name.trim());

export function StudentNumberFields({
  value,
  onChange,
}: {
  value: StudentNumberValue;
  onChange: (next: StudentNumberValue) => void;
}) {
  const set = (patch: Partial<StudentNumberValue>) =>
    onChange({ ...value, ...patch });

  const filled = value.grade && value.classNumber && value.seatNumber;

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-3 gap-2">
        <AppField label="학년" htmlFor="grade">
          <AppSelect
            id="grade"
            items={GRADE_ITEMS}
            value={value.grade}
            onValueChange={(grade) => set({ grade })}
            placeholder="학년"
          />
        </AppField>
        <AppField label="반" htmlFor="class">
          <AppSelect
            id="class"
            items={CLASS_ITEMS}
            value={value.classNumber}
            onValueChange={(classNumber) => set({ classNumber })}
            placeholder="반"
          />
        </AppField>
        <AppField label="번호" htmlFor="seat">
          <AppSelect
            id="seat"
            items={SEAT_ITEMS}
            value={value.seatNumber}
            onValueChange={(seatNumber) => set({ seatNumber })}
            placeholder="번호"
          />
        </AppField>
      </div>

      <AppField label="이름" htmlFor="name">
        <AppInput
          id="name"
          autoComplete="name"
          placeholder="실명을 입력하세요"
          maxLength={50}
          value={value.name}
          onChange={(event) => set({ name: event.target.value })}
        />
      </AppField>

      {filled ? (
        <div className="flex flex-wrap items-baseline gap-2.5 rounded-md bg-primary-soft px-4 py-3.5">
          <span className="text-sm text-muted-foreground">학번</span>
          <b className="text-xl tracking-wide text-primary-deep tabular-nums">
            {formatStudentNumber({
              grade: Number(value.grade),
              classNumber: Number(value.classNumber),
              seatNumber: Number(value.seatNumber),
            })}
          </b>
          <span className="text-sm text-muted-foreground">
            {`${value.grade}학년 ${value.classNumber}반 ${value.seatNumber}번`}
          </span>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        선생님 화면에는 이 학번과 이름으로 보여요. 잘못 고르면 다른 친구 자리에 들어가니 꼭
        확인해 주세요.
      </p>
    </div>
  );
}
