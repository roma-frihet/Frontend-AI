// e2e는 백엔드도 Supabase도 띄우지 않는다. 브라우저가 나가는 요청을 전부 가로채서
// 화면과 흐름만 검증한다. 서버가 실제로 무엇을 돌려주는지는 여기 책임이 아니다.

import type { Page, Route } from "@playwright/test";

const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** supabase-js가 저장할 수 있는 모양의 가짜 토큰. 서명은 검증하지 않는다. */
export const fakeAccessToken = (role?: "teacher") =>
  [
    base64url({ alg: "HS256", typ: "JWT" }),
    base64url({
      sub: "00000000-0000-0000-0000-000000000001",
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      app_metadata: role ? { role } : {},
    }),
    "test-signature",
  ].join(".");

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

/**
 * Supabase Auth의 로그인·가입 응답을 가짜 세션으로 돌려준다.
 * 교사와 학생을 가르는 것은 user.app_metadata.role이다. 서버도 같은 값을 본다.
 */
export const mockSupabaseAuth = async (page: Page, role?: "teacher") => {
  const requests: { url: string; body: unknown }[] = [];

  await page.route("**/auth/v1/**", async (route) => {
    const url = route.request().url();

    if (/\/auth\/v1\/(token|signup)/.test(url)) {
      requests.push({ url, body: route.request().postDataJSON() });

      const token = fakeAccessToken(role);
      return json(route, {
        access_token: token,
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: "00000000-0000-0000-0000-000000000001",
          aud: "authenticated",
          email: (route.request().postDataJSON() as { email?: string })?.email,
          app_metadata: role ? { role } : {},
          user_metadata: {},
        },
      });
    }

    return json(route, {});
  });

  return requests;
};

type ApiStubs = Record<string, unknown>;

/**
 * 백엔드 응답을 경로별로 흉내 낸다. 키는 `/api/v1/...`로 시작하는 경로 조각이다.
 *
 * 가장 긴 키가 이긴다. `/classrooms`와 `/classrooms/2/students`가 함께 있을 때
 * 짧은 쪽이 먼저 잡히면 엉뚱한 응답이 나간다.
 *
 * 맞는 것이 없으면 404로 떨어뜨려 테스트가 조용히 통과하지 않게 한다.
 */
export const mockApi = async (page: Page, stubs: ApiStubs) => {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const match = Object.keys(stubs)
      .filter((key) => path.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];

    if (!match) {
      return json(
        route,
        {
          status: 404,
          title: "NOT_STUBBED",
          detail: `테스트에 ${path} 응답이 준비되지 않았습니다.`,
          code: "TEST",
        },
        404,
      );
    }

    return json(route, stubs[match]);
  });
};

export const SCHOOLS = [{ id: 1, name: "다원중학교" }];

export const MEMBERSHIPS = [
  {
    id: 1,
    classroomId: 2,
    classNo: 5,
    grade: 3,
    subjectName: "과학",
    studentName: "김하늘",
    studentNumber: "30512",
  },
];

export const REPORT = {
  classroomId: 2,
  classNo: 5,
  grade: 3,
  subjectName: "과학",
  openLesson: {
    lessonNumber: 1,
    title: "광합성",
    questionCount: 2,
    phase: "READY",
    nextIndex: 0,
  },
  latestScore: {
    lessonNumber: 1,
    correctCount: 1,
    questionCount: 2,
    classAverageCorrect: 1.0,
  },
  scores: [
    {
      lessonNumber: 1,
      correctCount: 1,
      questionCount: 2,
      classAverageCorrect: 1.0,
    },
  ],
  totalCorrectCount: 1,
  totalQuestionCount: 2,
  recentWrongQuestions: [],
};

// --- 교사 쪽 기본 응답 ---

export const TEACHER_MYPAGE = {
  profile: { name: "예시 선생님", schoolId: 1, schoolName: "다원중학교" },
  courses: [
    {
      id: 2,
      grade: 3,
      subjectId: 251,
      subjectName: "과학",
      lessonCount: 2,
      classrooms: [{ id: 2, classNo: 5 }],
    },
  ],
};

export const TEACHER_CLASSROOMS = [
  {
    id: 2,
    courseId: 2,
    grade: 3,
    subjectName: "과학",
    classNo: 5,
    joinCode: null,
    joinCodeExpiresAt: null,
    studentCount: 1,
  },
];

/** 이미 연 차시(1)와 아직 안 연 차시(2) */
export const TEACHER_LESSONS = [
  {
    lessonNumber: 1,
    title: "광합성",
    questionCount: 1,
    classrooms: [{ classroomId: 2, classNo: 5, status: "FINISHED" }],
  },
  {
    lessonNumber: 2,
    title: "호흡",
    questionCount: 0,
    classrooms: [{ classroomId: 2, classNo: 5, status: "PLANNED" }],
  },
];

export const TEACHER_QUESTIONS = [
  {
    id: 102,
    lessonNumber: 1,
    type: "MULTIPLE_CHOICE",
    content: "광합성이 일어나는 곳은?",
    timeLimitSec: 30,
    explanation: "엽록체에서 일어납니다.",
    displayOrder: 0,
    options: [
      { id: 102, displayOrder: 0, content: "엽록체", isCorrect: true },
      { id: 103, displayOrder: 1, content: "핵", isCorrect: false },
    ],
  },
];

/** 학급 관리 반 카드 */
export const TEACHER_SUMMARIES = [
  {
    classroomId: 2,
    courseId: 2,
    grade: 3,
    subjectName: "과학",
    classNo: 5,
    studentCount: 1,
    openLesson: null,
    lastFinishedLessonNumber: 1,
    latestLessonNumber: 1,
    latestQuestionCount: 2,
    latestAverageCorrect: 1.0,
    watchStudentCount: 1,
  },
];

export const TEACHER_STUDENTS = {
  classroomId: 2,
  classNo: 5,
  studentCount: 1,
  students: [
    {
      membershipId: 1,
      studentName: "김하늘",
      studentNumber: "30512",
      recentScores: [{ lessonNumber: 1, correctCount: 1, questionCount: 2 }],
      latestCorrectCount: 1,
      totalCorrectCount: 1,
      totalQuestionCount: 2,
      status: "NOT_RESPONDED",
    },
  ],
};

/** 1차시 결과. 객관식 하나, 주관식 하나. 주관식은 인정 답안에 없는 "엽록체 안"이 섞여 있다. */
export const QUESTION_STATS = [
  {
    classroomId: 2,
    classNo: 5,
    status: "FINISHED",
    studentCount: 1,
    responseCount: 1,
    questions: [
      {
        questionId: 102,
        displayOrder: 0,
        type: "MULTIPLE_CHOICE",
        content: "광합성이 일어나는 곳은?",
        hasImage: false,
        answeredCount: 1,
        rightCount: 1,
        noAnswerCount: 0,
        options: [
          { optionId: 102, displayOrder: 0, content: "엽록체", hasImage: false, count: 1, isCorrect: true },
          { optionId: 103, displayOrder: 1, content: "핵", hasImage: false, count: 0, isCorrect: false },
        ],
        acceptedAnswers: [],
        answerTexts: [],
      },
      {
        questionId: 104,
        displayOrder: 1,
        type: "SHORT_ANSWER",
        content: "광합성에 필요한 기체는?",
        hasImage: false,
        answeredCount: 1,
        rightCount: 0,
        noAnswerCount: 0,
        options: [],
        acceptedAnswers: ["이산화탄소"],
        answerTexts: [{ answerText: "이산화 탄소 기체", count: 1, rightCount: 0 }],
      },
    ],
  },
];

export const STUDENT_ANSWERS = {
  membershipId: 1,
  studentName: "김하늘",
  studentNumber: "30512",
  lessonNumber: 1,
  lessonTitle: "광합성",
  status: "FINISHED",
  questionCount: 2,
  correctCount: 1,
  answers: [
    {
      questionId: 104,
      // 가운데 문제를 지워 displayOrder에 빈 번호가 생긴 경우. 화면 번호는 number를 쓴다.
      number: 2,
      displayOrder: 3,
      type: "SHORT_ANSWER",
      content: "광합성에 필요한 기체는?",
      imageUrl: null,
      options: [],
      acceptedAnswers: ["이산화탄소"],
      answerText: "이산화 탄소 기체",
      result: "WRONG",
      attemptAnswerId: 900,
      byTimeout: false,
      isOverridden: false,
    },
  ],
};

/** 교사 화면이 처음 그릴 때 부르는 응답 전부. 경로가 겹치면 가장 긴 키가 이긴다. */
export const teacherStubs = (extra: Record<string, unknown> = {}) => ({
  "/api/v1/teacher/mypage": TEACHER_MYPAGE,
  "/api/v1/teacher/classrooms/summaries": TEACHER_SUMMARIES,
  "/api/v1/teacher/classrooms/2/students/1/lessons/1/answers": STUDENT_ANSWERS,
  "/api/v1/teacher/classrooms/2/students": TEACHER_STUDENTS,
  "/api/v1/teacher/classrooms": TEACHER_CLASSROOMS,
  "/api/v1/teacher/courses/2/lessons/1/question-stats": QUESTION_STATS,
  "/api/v1/teacher/courses/2/lessons/1/questions": TEACHER_QUESTIONS,
  "/api/v1/teacher/courses/2/lessons/2/questions": [],
  "/api/v1/teacher/courses/2/lessons": TEACHER_LESSONS,
  "/api/v1/teacher/courses/2/scores": {
    content: [
      {
        classroomId: 2,
        classNo: 5,
        membershipId: 1,
        studentName: "김하늘",
        studentNumber: "30512",
        lessonNumber: 1,
        correctCount: 1,
        questionCount: 2,
      },
    ],
    pageInfo: { page: 0, size: 100, hasNext: false },
  },
  "/api/v1/teacher/subjects": [{ id: 251, schoolLevel: "MIDDLE", name: "과학" }],
  ...extra,
});

export const signInAsTeacher = async (page: Page) => {
  await page.goto("/teacher/login");
  await page.getByLabel("이메일").fill("teacher1@example.com");
  await page.getByLabel("비밀번호").fill("test1234");
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("/teacher");
};
