# Frontend-AI

프론트엔드 전용 레포입니다. 백엔드(Kotlin + Spring)는 별도 레포이며, 백엔드가 배포하는 OpenAPI 스펙을 받아 타입/React Query 훅을 생성해 연동합니다. 코드는 주로 AI(Claude Code)가 작성하므로, 일관성을 위한 규칙은 [CLAUDE.md](CLAUDE.md)와 [DESIGN.md](DESIGN.md)에 있습니다.

**스택**: Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · @tanstack/react-query · orval · Playwright

## 시작하기

```bash
nvm use                # .nvmrc의 Node 버전 사용
npm ci
cp .env.example .env.local   # 값 채우기
npx playwright install chromium   # e2e 테스트용 (최초 1회)
npm run dev            # http://localhost:3000
```

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 라우트 타입 생성 + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run check` | typecheck → lint → build (PR 전 필수) |
| `npm run e2e` | Playwright 테스트 (개발 서버 자동 기동) |
| `npm run api:pull` | `api-spec.version`의 openapi.json을 `api/openapi.json`으로 다운로드 |
| `npm run api:gen` | `api/openapi.json`이 있으면 orval로 `src/api/generated` 생성 |
| `npm run api:update` | api:pull → api:gen → typecheck |

## API 스펙 연동 방식

```
백엔드 CI                 스펙 저장소                    이 레포
springdoc → openapi.json → {BASE_URL}/{service}/{version}/openapi.json
        │                                                   ▲
        └─ repository_dispatch (api-spec-updated, version) ─┤
                                                            ▼
                                   api-spec-update 워크플로: api-spec.version 갱신
                                   → api:pull → api:gen → typecheck
                                   → `api-spec/<version>` 브랜치로 PR 자동 생성
```

1. 백엔드 CI가 `openapi.json`을 버전별로 스펙 저장소에 올립니다.
2. 백엔드 CI가 이 레포로 `repository_dispatch`(type `api-spec-updated`, `client_payload.version`)를 보냅니다. (Actions 탭에서 `API Spec Update`를 수동 실행해도 됩니다.)
3. 워크플로가 스펙을 받아 클라이언트를 생성하고 PR을 만듭니다. typecheck가 실패해도 PR은 만들어지며, 본문에 실패 사실이 표시됩니다.
4. 리뷰 후 머지하면 `api-spec.version`이 해당 버전으로 고정됩니다.

로컬에서는 `api-spec.version`을 원하는 버전으로 바꾸고 `npm run api:update`를 실행합니다. 초기값 `none`은 "아직 연결된 스펙 없음"을 뜻합니다.

백엔드 CI에서 dispatch를 보내는 예시:

```bash
curl -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/<owner>/<this-repo>/dispatches \
  -d '{"event_type":"api-spec-updated","client_payload":{"version":"1.4.0"}}'
```

## 필요한 Secrets / 환경변수

GitHub 저장소 → Settings → Secrets and variables → Actions 에서 등록합니다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `API_SPEC_BASE_URL` | 필수 | 스펙 저장소 기본 URL |
| `API_SPEC_TOKEN` | 선택 | 스펙 저장소 인증이 필요할 때 (`Authorization: Bearer`) |
| `PR_TOKEN` | 선택 | 자동 생성 PR에서도 CI를 실행하고 싶을 때 쓰는 PAT. 없으면 `GITHUB_TOKEN`을 쓰며, 이 경우 자동 PR에서는 CI가 자동 실행되지 않습니다 |

추가로 Settings → Actions → General → Workflow permissions 에서 **"Allow GitHub Actions to create and approve pull requests"** 를 켜야 자동 PR이 생성됩니다.

로컬 환경변수는 `.env.example`을 참고하세요 (`API_SPEC_BASE_URL`, `API_SPEC_SERVICE`(기본 `backend`), `API_SPEC_TOKEN`, `NEXT_PUBLIC_API_BASE_URL`).

## main 브랜치 보호 설정

Settings → Branches → Add branch ruleset (또는 Branch protection rule), 대상 `main`:

1. **Require a pull request before merging** 체크
2. **Require status checks to pass before merging** 체크 → 상태 체크로 CI 워크플로의 `check` job 선택
   (status check는 워크플로가 한 번 실행된 뒤에 검색됩니다)
3. (권장) **Require branches to be up to date before merging**, **Block force pushes**
