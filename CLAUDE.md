# CLAUDE.md

이 문서는 AI(Claude Code)가 이 레포에서 일관되게 작업하기 위한 규칙이다. 코드는 대부분 AI가 작성하므로, 아래 규칙을 임의로 어기지 말 것.

> Next.js 버전에 따라 API/규칙이 다를 수 있다. 코드를 쓰기 전에 `AGENTS.md`의 안내대로 `node_modules/next/dist/docs/`의 관련 문서를 확인한다.

## 프로젝트 개요

- **프론트엔드 전용 레포**다. 백엔드(Kotlin + Spring, DDD)는 별도 레포이다.
- 백엔드는 CI에서 springdoc으로 `openapi.json`을 생성해 버전별로 스펙 저장소에 올린다.
- 프론트는 `api-spec.version`에 적힌 버전의 스펙을 받아 orval로 타입/React Query 훅을 생성해 사용한다. (스펙 기반 연동)
- 스택: Next.js(App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · @tanstack/react-query · orval · Playwright

## 폴더 구조

```
src/app/                # Next.js App Router (페이지, layout, providers.tsx)
src/components/ui/      # shadcn/ui 컴포넌트 (CLI로 생성, 직접 크게 수정 금지)
src/components/         # 도메인 컴포넌트 (ui 컴포넌트를 조합/래핑)
src/api/generated/      # orval 생성물 (수정 금지, api:gen으로만 갱신)
src/lib/                # 유틸, query client 등
e2e/                    # Playwright 테스트
api/                    # 받아온 openapi.json 위치 (api:pull 결과)
scripts/                # 보조 스크립트 (pull-spec.mjs 등)
.claude/skills/         # AI 스킬 (hallmark)
DESIGN.md               # 디자인 판단 기준
api-spec.version        # 연동할 백엔드 스펙 버전 (none이면 미연결)
```

## 스타일 규칙

- 색상·간격·폰트·radius는 `src/app/globals.css`의 **CSS 변수(토큰)와 Tailwind 테마**만 사용한다.
- 임의의 hex/rgb 값, `px` 하드코딩, `text-[13px]`·`bg-[#fff]` 같은 임의값(arbitrary value) 금지.
- 필요한 값이 토큰에 없으면 코드에 박지 말고, 토큰 추가를 먼저 제안한다.

## 컴포넌트 규칙

- 새 컴포넌트를 만들기 전에 `src/components/ui`를 먼저 확인한다.
- 없으면 `npx shadcn@latest add <name>`으로 추가한다.
- `components/ui`는 직접 크게 수정하지 말고, `src/components/`에서 **감싸서(wrapping)** 사용한다.
- 현재 shadcn 스타일(base-nova)에는 `form` 컴포넌트가 없고 `field`가 대신 쓰인다.

## API 규칙

- 서버 호출은 **반드시 `src/api/generated`의 훅으로만** 한다.
- 생성물은 손으로 수정하지 않는다.
- API의 형태(경로, 필드, 응답)를 추측해서 `fetch`를 직접 작성하지 않는다.
- 스펙이 바뀌었다면 먼저 `npm run api:update`를 실행한다.
- 스펙이 아직 연결되지 않았으면(`api-spec.version`이 `none`) API 연동 코드를 만들지 말고 사용자에게 알린다.

## 디자인 규칙

- 디자인 판단은 `DESIGN.md`를 따른다.
- `DESIGN.md`나 테마를 바꿔야 하면 **바로 바꾸지 말고 먼저 제안**한다.
- 새 화면/페이지 디자인에는 `.claude/skills/hallmark` 스킬을 사용한다.

## 완료 조건

- `npm run check`(typecheck → lint → build)가 통과해야 한다.
- 화면을 변경했다면 Playwright MCP로 직접 띄워서(`npm run dev`) 확인한다.
- 주요 동작을 추가했다면 `e2e/`에 테스트를 추가하고 `npm run e2e`로 확인한다.

## 자주 쓰는 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 체크 |
| `npm run lint` | ESLint |
| `npm run check` | typecheck → lint → build |
| `npm run e2e` | Playwright 테스트 |
| `npm run api:pull` | 지정 버전의 openapi.json 받기 |
| `npm run api:gen` | orval로 타입/훅 생성 |
| `npm run api:update` | api:pull → api:gen → typecheck |
| `npx shadcn@latest add <name>` | shadcn 컴포넌트 추가 |
