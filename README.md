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

## 5. 배포

프론트는 **Vercel**, 백엔드는 Cloud Run이다. 브라우저는 백엔드를 직접 부르지 않고
`next.config.ts`의 rewrites가 `/api/v1/*`을 `API_ORIGIN`으로 넘긴다 (백엔드에 CORS 설정이 없다).

### Vercel 환경변수

| 이름 | 값 | 비고 |
| --- | --- | --- |
| `API_ORIGIN` | 백엔드 Cloud Run 주소 | **빌드할 때 구워진다.** 바꾸면 다시 배포해야 한다 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | 운영 Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_…`) | 공개 키다. Secret key를 넣지 않는다 |

`API_ORIGIN`을 빼먹으면 localhost가 그대로 박혀 배포본이 조용히 죽으므로,
Vercel 빌드에서는 값이 없으면 빌드를 멈춘다.

함수 리전은 `vercel.json`에서 서울(`icn1`)로 둔다. 백엔드도 서울이라 왕복이 짧다.

### 운영 Supabase 설정

학생은 학번을 `s1-0101@students.roma-frihet.app` 꼴로 바꿔 가입한다. 받을 수 없는
주소이므로 **Confirm email을 꺼 두어야 한다.** 켜면 Supabase가 주소로 메일을 보낼 수
있는지 먼저 검사해서, 이 도메인이 실재하지 않으므로 `email_address_invalid`로
**모든 학생 가입이 막힌다.** 로컬 Supabase에는 이 검사가 없어 로컬에서는 드러나지 않는다.

`Minimum password length`는 6이어야 한다. 프론트 `MIN_PASSWORD_LENGTH`, 서버
`StudentPasswordRequest`와 같은 값이다. 하나만 다르면 화면은 통과시키고 뒤에서 거절당한다.

### 교사 계정

교사 권한은 토큰의 `app_metadata.role`이 `teacher`일 때만 생긴다. 이 값은 service_role
키로만 넣을 수 있어 가입 화면이 없다. Supabase 대시보드에서 계정을 만든 뒤
**App Metadata**(User Metadata가 아니다)에 `{"role": "teacher"}`를 넣는다.

교사 프로필(이름·학교)은 화면에서 만들 수 없다. 마이페이지는 저장된 학교를 그대로
돌려보내므로 프로필이 없으면 `schoolId`가 비어 400이 난다. 계정을 만들 때 아래처럼
프로필까지 같이 넣는다.

```bash
curl -X PUT "$API_ORIGIN/api/v1/teacher/profile" \
  -H "Authorization: Bearer <교사 토큰>" -H "Content-Type: application/json" \
  -d '{"schoolId":1,"name":"이름"}'
```

## 6. 명령어

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

## 7. Claude Code

- 레포를 열면 `.mcp.json`의 Playwright MCP 사용 승인 프롬프트가 뜬다 → 승인
- 디자인 작업은 `.claude/skills/hallmark` 스킬 사용

## 8. 문제 해결

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
