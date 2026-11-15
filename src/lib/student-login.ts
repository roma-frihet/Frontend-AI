// 학생은 학번으로 로그인하지만 Supabase Auth는 이메일만 받는다.
// 그래서 프론트가 학번을 이메일 모양으로 바꿔서 보낸다.
//
// 규칙은 서버의 StudentLoginEmailPolicy.kt와 **반드시 같아야 한다**.
//   s{schoolId}-{학년}{반 2자리}{번호 2자리}@{도메인}
//   7번 학교 2학년 1반 1번  →  s7-20101@students.roma-frihet.app
//
// 도메인도 서버의 STUDENT_LOGIN_EMAIL_DOMAIN과 같아야 한다. 다르면 가입 시 SP004로 거절된다.

export const STUDENT_GRADE_MIN = 1;
export const STUDENT_GRADE_MAX = 3;
export const STUDENT_CLASS_NUMBER_MIN = 1;
export const STUDENT_CLASS_NUMBER_MAX = 99;
export const STUDENT_SEAT_NUMBER_MIN = 1;
export const STUDENT_SEAT_NUMBER_MAX = 99;

const DEFAULT_LOGIN_EMAIL_DOMAIN = "students.roma-frihet.app";

// 서버 StudentPasswordRequest.Change의 @minLength, 그리고 Supabase Auth의
// minimum_password_length와 모두 같은 값이어야 한다. 셋 중 하나만 낮추면
// 화면은 통과시키는데 뒤에서 거절당한다. 쓰는 사람이 중학생이라 6자다.
export const MIN_PASSWORD_LENGTH = 6;

export type StudentNumber = {
  schoolId: number;
  grade: number;
  classNumber: number;
  seatNumber: number;
};

const loginEmailDomain = () =>
  process.env.NEXT_PUBLIC_STUDENT_LOGIN_EMAIL_DOMAIN || DEFAULT_LOGIN_EMAIL_DOMAIN;

const pad2 = (value: number) => String(value).padStart(2, "0");

const inRange = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

/** 학번이 서버가 받아 주는 범위 안인지 확인한다. */
export const isValidStudentNumber = ({
  schoolId,
  grade,
  classNumber,
  seatNumber,
}: StudentNumber): boolean =>
  Number.isInteger(schoolId) &&
  schoolId > 0 &&
  inRange(grade, STUDENT_GRADE_MIN, STUDENT_GRADE_MAX) &&
  inRange(classNumber, STUDENT_CLASS_NUMBER_MIN, STUDENT_CLASS_NUMBER_MAX) &&
  inRange(seatNumber, STUDENT_SEAT_NUMBER_MIN, STUDENT_SEAT_NUMBER_MAX);

/** 학번을 Supabase 로그인용 이메일로 바꾼다. */
export const toStudentLoginEmail = (studentNumber: StudentNumber): string => {
  if (!isValidStudentNumber(studentNumber)) {
    throw new Error(`학번 범위를 벗어났습니다: ${JSON.stringify(studentNumber)}`);
  }

  const { schoolId, grade, classNumber, seatNumber } = studentNumber;

  return `s${schoolId}-${grade}${pad2(classNumber)}${pad2(seatNumber)}@${loginEmailDomain()}`;
};

/**
 * 로그인 계정(이메일)에서 학교·학번을 되읽는다. toStudentLoginEmail의 반대다.
 * 학생 규칙에 맞지 않으면(교사 계정 등) null을 돌려준다.
 */
export const parseStudentLoginEmail = (email: string): StudentNumber | null => {
  const matched = /^s(\d+)-(\d)(\d{2})(\d{2})@/i.exec(email);
  if (!matched) return null;

  const studentNumber = {
    schoolId: Number(matched[1]),
    grade: Number(matched[2]),
    classNumber: Number(matched[3]),
    seatNumber: Number(matched[4]),
  };

  return isValidStudentNumber(studentNumber) ? studentNumber : null;
};

// 학생은 거의 늘 같은 학교로 들어온다. 마지막에 고른 학교를 기억해 두고 다음에 미리 골라 준다.
const LAST_SCHOOL_KEY = "roma-frihet:last-school-id";

export const rememberLastSchool = (schoolId: string) => {
  try {
    window.localStorage.setItem(LAST_SCHOOL_KEY, schoolId);
  } catch {
    // 시크릿 모드 등 저장이 막힌 환경에서는 그냥 기억하지 않는다.
  }
};

export const recallLastSchool = (): string => {
  try {
    return window.localStorage.getItem(LAST_SCHOOL_KEY) ?? "";
  } catch {
    return "";
  }
};

/** 화면에 보여 줄 학번 문자열. 서버 StudentProfile.studentNumber()와 같은 모양이다. */
export const formatStudentNumber = ({
  grade,
  classNumber,
  seatNumber,
}: Omit<StudentNumber, "schoolId">): string =>
  `${grade}${pad2(classNumber)}${pad2(seatNumber)}`;
