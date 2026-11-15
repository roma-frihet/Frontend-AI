# Frontend-AI 런북

프론트엔드 전용 레포. 작업 규칙은 [CLAUDE.md](CLAUDE.md), 디자인 기준은 [DESIGN.md](DESIGN.md), 브랜치/커밋 규칙은 [docs/CONVENTION.md](docs/CONVENTION.md).

## 1. 사전 준비

- Node: `.nvmrc` 버전 (`nvm use`)
- npm
- Docker (로컬 Supabase 실행에 필요)
- 백엔드 레포(`roma-frihet/server`)를 옆에 받아 둔다 — 화면을 붙여 보려면 같이 띄워야 한다
- Claude Code (AI 작업 시)

## 2. 최초 세팅

```bash
git clone <repo-url> && cd Frontend-AI
nvm use
npm ci
npx playwright install chromium
cp .env.example .env.local
```

`.env.local`의 Supabase 값은 아래 3번에서 받는다.

## 3. 로컬 실행

로그인이 Supabase Auth로 동작하므로 **Supabase → 백엔드 → 프론트** 순으로 띄운다.

```bash
# 1) 로컬 Supabase (백엔드 레포에서)
cd ../server && npx supabase start
npx supabase status -o env        # PUBLISHABLE_KEY, API_URL 확인

# 2) 백엔드 (develop 브랜치)
./gradlew bootRun                 # http://localhost:8080

# 3) 프론트
cd ../Frontend-AI && npm run dev  # http://localhost:3000
```

`.env.local`에 2~3번 값을 채운다.

| 키 | 값 |
| --- | --- |
| `API_ORIGIN` | `http://localhost:8080` |
| `NEXT_PUBLIC_SUPABASE_URL` | `supabase status`의 `API_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `supabase status`의 `PUBLISHABLE_KEY` |

브라우저는 백엔드를 직접 부르지 않는다. `/api/v1/*`을 같은 출처로 호출하면
`next.config.ts`의 rewrites가 `API_ORIGIN`으로 넘긴다 (백엔드에 CORS 설정이 없다).

## 4. 작업 흐름

1. `develop`에서 브랜치 생성 ([컨벤션](docs/CONVENTION.md))
2. 작업 (AI 작업 규칙은 CLAUDE.md)
3. `npm run check` 통과 확인
4. 화면을 바꿨다면 `npm run e2e` 실행
5. PR 생성 → CI 통과 → 머지

## 5. 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 로컬 개발 환경 실행 |
| `npm run check` | typecheck → lint → build (PR 전 필수) |
| `npm run typecheck` | 타입 체크 |
| `npm run lint` | ESLint |
| `npm run build` | 프로덕션 빌드 |
| `npm run e2e` | Playwright 테스트 |
| `npm run api:sync` | 백엔드에서 openapi.json 받기 (백엔드가 떠 있어야 함) |
| `npm run api:update` | api:sync → api:gen → typecheck |
| `npx shadcn@latest add <name>` | UI 컴포넌트 추가 |

## 6. Claude Code

- 레포를 열면 `.mcp.json`의 Playwright MCP 사용 승인 프롬프트가 뜬다 → 승인
- 디자인 작업은 `.claude/skills/hallmark` 스킬 사용

## 7. 문제 해결

| 증상 | 해결 |
| --- | --- |
| Node 버전 오류 (`EBADENGINE`) | `nvm use` 후 재설치 |
| 설치/빌드가 이상함 | `rm -rf node_modules .next && npm ci` |
| `localhost:3000` 포트 충돌 | 기존 프로세스 종료 후 재실행 |
| e2e에서 브라우저 없음 | `npx playwright install chromium` |
| API 호출이 전부 401 | Supabase가 떠 있는지, `.env.local`의 Supabase 값이 맞는지 확인 |
| `/api/v1/*`이 404 | 백엔드(`:8080`)가 떠 있는지, `API_ORIGIN`이 맞는지 확인 |
| `api:sync` 실패 | 백엔드를 먼저 띄운다 |
| `LayoutProps` 타입 없음 | `npm run typecheck` (typegen 포함) |
