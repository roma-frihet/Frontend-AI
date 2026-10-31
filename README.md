# Frontend-AI 런북

프론트엔드 전용 레포. 작업 규칙은 [CLAUDE.md](CLAUDE.md), 디자인 기준은 [DESIGN.md](DESIGN.md), 브랜치/커밋 규칙은 [docs/CONVENTION.md](docs/CONVENTION.md).

## 1. 사전 준비

- Node: `.nvmrc` 버전 (`nvm use`)
- npm
- Claude Code (AI 작업 시)

## 2. 최초 세팅

```bash
git clone <repo-url> && cd Frontend-AI
nvm use
npm ci
npx playwright install chromium
cp .env.example .env.local
```

`.env.local`은 현재 비워 둬도 된다 (API 연동 전).

## 3. 로컬 실행

```bash
npm run dev
```

http://localhost:3000 접속.

## 4. 작업 흐름

1. `main`에서 브랜치 생성 ([컨벤션](docs/CONVENTION.md))
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
| `LayoutProps` 타입 없음 | `npm run typecheck` (typegen 포함) |
