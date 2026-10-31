# 컨벤션

## 브랜치

`<type>/<짧은-설명>` (영문 소문자, 하이픈)

```
feat/login-page
fix/table-pagination
chore/bootstrap
```

- `main`에서 따고, PR로만 머지한다.

## 커밋

`<type>: <설명>` (설명은 한글, 한 줄, 마침표 없음)

```
feat: 로그인 페이지 추가
fix: 테이블 페이지네이션 오류 수정
```

## type

| type | 용도 |
| --- | --- |
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `style` | UI/스타일 변경 |
| `test` | 테스트 |
| `docs` | 문서 |
| `chore` | 설정, 의존성, 기타 |
| `ci` | CI 설정 |

브랜치 type과 커밋 type은 같은 목록을 쓴다.
