import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 디자인 일관성. 카드·곡률·상태 표시는 공통 컴포넌트에서만 정한다(DESIGN.md "공통 컴포넌트").
  {
    files: ["src/**/*.tsx"],
    ignores: [
      "src/components/ui/**",
      "src/components/surface.tsx",
      "src/components/states.tsx",
      "src/components/text-action.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[
          [String.raw`\bshadow-card\b`, "카드는 Panel이나 panelClass()로 만드세요 (@/components/surface)."],
          [String.raw`\brounded-(sm|xl|2xl|3xl)\b`, "곡률은 rounded-lg(카드) / rounded-md(입력·버튼·안내 상자·이미지) / rounded-full(칩)만 써요."],
          ["불러오는 중", "로딩 표시는 LoadingState나 LOADING_TEXT를 쓰세요 (@/components/states)."],
          [" · ", "가운뎃점으로 정보를 잇지 마세요. 요소를 나누거나(LessonName 등) 문장으로 쓰세요 (DESIGN.md)."],
        ].flatMap(([pattern, message]) => [
          { selector: `Literal[value=/${pattern}/]`, message },
          { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
          { selector: `JSXText[value=/${pattern}/]`, message },
        ]),
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 외부/생성 코드
    ".claude/**",
    "src/api/generated/**",
  ]),
]);

export default eslintConfig;
