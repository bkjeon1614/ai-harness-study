# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

React 19 + TypeScript + Vite 기반의 **노트 앱 실습 프로젝트**. 강의/학습 목적의 코드베이스이며, `src/types/note.ts` 상단 주석(`tags 필드는 아직 없음 — 강의에서 추가할 것`)처럼 의도적으로 미완성된 부분이 남아 있다. 백엔드는 `json-server`로 `db.json`을 REST API처럼 노출한다.

## 개발 명령어

```bash
npm run dev        # Vite(:5173) + json-server(:3001) 동시 실행 (concurrently)
npm run server     # json-server 단독 실행 (db.json 기반, :3001)
npm run build      # tsc 타입체크 후 vite build (타입 에러 시 빌드 실패)
npm run lint       # ESLint --fix
npm run format     # Prettier write
npm test           # vitest run (1회 실행)
npm run test:watch # vitest watch 모드
```

- 앱: `http://localhost:5173`
- API: `http://localhost:3001/notes`
- 단일 테스트 실행: `npx vitest run path/to/file.test.ts` 또는 `-t "test name"`로 필터.

## TDD 이슈 워크플로우

새 GitHub 이슈 작업 시 다음 7단계를 순서대로 진행한다. Claude 는 **현재 어느 단계인지 추적**하고, 단계가 끝날 때마다 **다음 단계가 무엇인지, 어떤 명령으로 호출하는지** 명시적으로 제안한다. **자동으로 다음 단계로 넘어가지 않는다.**

| #   | 명령                                                            | 종류  | 책임                                                                 |
| --- | --------------------------------------------------------------- | ----- | -------------------------------------------------------------------- |
| 1   | `/test-scenarios N`                                             | skill | 시그니처 + 분류된 시나리오 도출, `docs/features/tag/issue-N.md` 산출 |
| 2   | `/tdd-red N`                                                    | skill | 시나리오를 실패 테스트로 작성, 매 시나리오 즉시 실패 확인            |
| 3   | `/tdd-green N`                                                  | skill | 최소 구현으로 모든 테스트 통과                                       |
| 4   | `@ac-verifier N`                                                | agent | AC 충족도 독립 검증 — **테스트 통과 ≠ AC 충족**                      |
| 5   | `/tdd-refactor N`                                               | skill | 행동 보존 구조 개선. 회귀 시 즉시 롤백                               |
| 6   | `/security-review N`                                            | skill | tsc + npm audit + `.env` 노출 점검                                   |
| 7   | commit → PR `--base feature/<spec>` → squash merge → 이슈 close | 수동  | 분할 커밋, base 브랜치로 PR, 머지 시 자동 close 트리거 (`Closes #N`) |

### 흐름 제어 규칙

- **각 단계 종료 후 Claude 의 응답에는 다음이 포함된다**: (a) 방금 끝난 단계 결과 요약, (b) 다음 단계 명령 (예: "다음 단계: `/tdd-red N`"), (c) 사용자 승인 대기 명시.
- **자동 연쇄 진행 금지** — Step N 완료 후 사용자 명시 승인 없이 Step N+1 의 슬래시/에이전트 명령을 Claude 가 대신 실행하지 않는다. 사용자가 직접 명령을 입력하거나 "다음 단계 진행" 같이 명시해야 한다. (단, 사용자가 "전부 진행해줘" / "권장사항 전부 완료" 같이 명시적 일괄 위임을 한 경우에만 예외 적용.)
- **단계 건너뛰기 감지** — 사용자가 Step 2 를 건너뛰고 Step 3 를 호출하면, Claude 는 진입 조건 미충족 (예: 시나리오 미작성 / 테스트 파일 미생성) 을 보고하고 선행 단계로 안내. 각 스킬의 Step 0 입력 검증과 동일한 의도.
- **단계 회귀 감지** — 예: REFACTOR 중 회귀 발생 시 GREEN 으로 자동 되돌리지 않고 사용자에게 보고 + 롤백 결정 위임.
- **GATE 위반 보고** — 인간 승인 게이트(`test-scenarios` 의 Step 2/7, `tdd-refactor` 의 Step 4, `security-review` 의 Step 4) 는 사용자 명시 승인 응답 없이 다음 Step 으로 진입하지 않는다.

### 이슈 의존성 처리

- 이슈가 다른 이슈에 의존하면 **선행 이슈가 머지된 base 위에서 새 브랜치를 분기**한다. 예: TAG-2 가 TAG-1 에 의존하면 TAG-1 머지 후 `git checkout main && git pull && git checkout -b feature/tag-2`.
- 의존성은 `docs/features/<feature>/issues.md` 의 "의존성 / 진행 순서" 섹션에 기록.
- 의존 이슈가 미머지인 상태에서 다음 이슈 RED 를 시작하면 시그니처/타입 충돌 위험 (예: 이번 사이클의 `NoteList.test.tsx` FIXTURE 가 후속 이슈의 Note 타입 확장과 충돌해 tsc 에러 발생). Claude 는 진입 시점에 이 위험을 경고하고 base 브랜치 정렬을 권장.

### Slash vs Agent

- `slash 명령` (`/test-scenarios`, `/tdd-*`, `/security-review`) — 같은 세션 컨텍스트 안에서 워크플로우를 실행. Claude 가 직접 도구를 호출하며 워크플로우 단계를 따른다.
- `@agent` (`@ac-verifier`) — 독립 서브에이전트 호출. 메인 컨텍스트와 분리된 환경에서 검증만 하고 결과를 회신. AC 검증처럼 "메인이 만든 결과를 제3자 시각으로 평가" 가 자연스러운 단계에 사용.

## 아키텍처

3계층 단방향 데이터 흐름. UI 컴포넌트는 직접 fetch하지 않고 반드시 Context를 거친다.

```
components/ ──useNotes()──▶ context/NotesContext ──api──▶ api/notes.ts ──fetch──▶ json-server
```

### 상태 관리 (`src/context/NotesContext.tsx`)

- 전역 상태는 `NotesProvider` 한 곳에만 존재. `notes`, `loading`, `error`와 mutation(`createNote`, `updateNote`, `deleteNote`)을 노출한다 — **이름은 `src/api/notes.ts`와 1:1로 맞춘다**.
- mutation은 항상 **서버 응답을 받은 뒤 로컬 state를 갱신**한다 (낙관적 업데이트 아님). 새 API 함수 추가 시 동일 패턴 유지.
- `useNotes()` 훅은 Provider 바깥에서 호출 시 throw — Provider 트리 안에서만 사용.

### API 레이어 (`src/api/notes.ts`)

- `API_URL`은 하드코딩(`http://localhost:3001`). 환경 변수가 아니므로 포트 변경 시 수정 필요.
- `createNote`/`updateNote`는 호출 시점에 `createdAt`/`updatedAt`을 ISO 문자열로 주입한다 — 타임스탬프 책임은 서버가 아닌 클라이언트.
- `Omit`/`Partial<Note>`로 입력 타입을 좁히는 패턴 유지.

### UI 구조 (`src/App.tsx` + `src/components/`)

- `App`이 `selectedNoteId`, `isCreating`, `searchQuery` 로컬 상태를 보관. 앞 두 개는 화면 모드("선택"/"새로 만들기"/"아무것도 없음")를, `searchQuery`는 `SearchBar`(사이드바 상단)에서 받아 `NoteList`로 내려 제목 필터링에 쓰인다 — props down + callback up 그대로.
- `Layout`은 `sidebar`/`main` slot을 받는 shell 컴포넌트(컴포지션 패턴). 자체 상태 없음.
- `NoteEditor`는 `selectedNoteId`/`isCreating` 변경 시 폼을 동기화하는 `useEffect`를 가진다 — deps에서 `selectedNote`는 제외(`eslint-disable`). 새 필드 추가 시 이 effect도 함께 수정.

### 타입 (`src/types/note.ts`)

`Note` 인터페이스가 단일 source of truth. 필드 추가 시 `db.json` 시드 데이터, `api/notes.ts`의 `Omit` 사용처, `NotesContext`의 mutation 시그니처를 함께 갱신.

컴포넌트 의존성 시각화는 `docs/architecture/index.html`(mermaid) 참조. 구조 변경 시 `mermaid-diagram` skill로 재생성.

## 스타일링

Tailwind CSS **v4**(`@tailwindcss/vite` 플러그인). 설정 파일(`tailwind.config.*`) 없이 `src/index.css`의 `@theme` 블록에서 커스텀 토큰을 정의한다:

- 색상은 `bg-foreground`, `text-muted-foreground`, `border-destructive` 등 의미 기반 토큰을 사용. 원시 색(`bg-gray-500`) 추가 금지 — `@theme`에 토큰부터 정의.
- 폰트: 본문 Pretendard, 디스플레이 Boogaloo(`index.html`에서 CDN 로드).
- 둥근 모서리는 `rounded-xl`/`rounded-2xl`/`rounded-3xl`로 통일.

**디자인 시스템은 `docs/design-system/`(The Digital Atelier)가 단일 참조점이다. 스타일 작업 전 반드시 확인** — 폴더 진입 가이드는 `docs/design-system/CLAUDE.md`(작업 트리거별 읽을 파일 매핑), 토큰은 `tokens.md`, 컴포넌트는 `components/<name>.md` (1파일=1컴포넌트). `@theme`에 미정의된 사양 토큰은 ⚠️로 표기되어 있으며 인라인 hex로 잠정 표현 가능.

@docs/design-system/README.md

## 코드 컨벤션

### 컴포넌트 구현 패턴

- **컴포넌트는 반드시 named export 만 사용한다** — `export default` 금지(엔트리 파일 포함). `import { ComponentName } from '...'` 형태로만 가져온다.
- **`export function ComponentName(...)` 형태의 named export + 함수 선언식**. 화살표 함수 컴포넌트나 `React.FC` 사용 안 함.
- props는 컴포넌트 바로 위에 `interface ComponentNameProps`로 선언, 비구조화로 받음.
- 파일 1개 = 컴포넌트 1개, 파일명은 PascalCase로 컴포넌트명과 동일.
- 자식이 부모 상태를 만지지 않는다 — props down + callback up. 콜백 prop은 `onXxx`, 내부 핸들러는 `handleXxx`.
- 컴포지션이 필요한 컨테이너(`Layout`)는 `ReactNode` slot prop을 받는다.

### 상태 관리 방식

- **서버에서 온 도메인 데이터(`notes`)는 Context, UI 모드/폼 입력은 `useState`로 로컬 보관**. Context에 UI 상태를 넣지 않는다.
- 폼은 controlled — `value` + `onChange` 쌍. 비제어 input/`ref` 사용 안 함.
- props → 로컬 state 동기화는 `useEffect`로 처리(예: `NoteEditor`가 `selectedNoteId` 바뀔 때 폼 리셋).
- 화면 모드는 boolean을 분산시키지 않고 App 레벨에서 조합한다(`selectedNoteId` + `isCreating`).

### API 호출 패턴

- `src/api/notes.ts`에 **리소스 단위로 모든 fetch를 모은다** — 컴포넌트/Context는 절대 `fetch`를 직접 호출하지 않는다.
- 모든 함수는 `async/await` + `if (!res.ok) throw new Error('Failed to X')` 패턴. 에러 메시지는 영문 동사구로 통일.
- 반환 타입은 항상 명시(`Promise<Note>` / `Promise<Note[]>` / `Promise<void>`).
- 입력 타입은 `Omit<Note, ...>`(create) / `Partial<Note>`(update)로 좁힌다.
- **mutation 동사는 `create` / `update` / `delete`로 통일**. API와 Context의 함수명·시그니처(객체 인자)는 1:1로 일치시킨다.
- 호출 측(Context)은 try/catch 없이 그대로 throw가 올라오게 하고, **최상단 useEffect 또는 UI 핸들러에서 잡는다**(`NoteEditor.handleSave`처럼).

### 에러 처리

- **사용자 알림용 `alert()` 금지**. 에러는 `console.error(message, err?)`로 콘솔에만 남긴다.
- 인라인 에러 UI는 이미 있는 곳(`NoteList`의 `error` 텍스트)만 사용. 새 토스트/모달을 추가하기 전에 합의된 위치에 일원화할 것.

### 네이밍 규칙

- 컴포넌트/타입/인터페이스: PascalCase. 함수/변수: camelCase. 상수 URL: `API_URL` 같은 단일 식별자 SCREAMING_SNAKE는 아님 — 이 코드베이스는 그냥 `const API_URL` 형태로 충분.
- 이벤트 핸들러는 `handle` + 동사(`handleSave`, `handleSelectNote`), prop 이름은 `on` + 동사(`onSelect`, `onDone`).
- API 함수는 `동사 + 리소스`(`fetchNotes`, `createNote`).

## 남아있는 일관성 결함 (수정 시 같이 정리할 것)

- **boolean state 접두사 혼재**: `isCreating`(is-)과 `saving`/`loading`(접두사 없음)이 공존. 새 boolean 추가 시 `is`/`has` 접두사로 통일 권장.
- **`NoteEditor` 의 `useEffect` deps에 `selectedNote` 누락 + `eslint-disable`**: 의도적이지만 위험. `selectedNote`를 deps에 넣거나, 동기화 로직을 파생 state 패턴으로 바꾸는 것이 정석.

## 커밋 메시지 규칙

`commitlint` + `husky commit-msg` 가 강제 — 위반 시 커밋 차단. 상세 규칙은 `commitlint.config.js`, CI 재검증은 `.github/workflows/commitlint.yml`. **`--no-verify` 우회 금지.**

- 형식: `<type>: <subject>` + 빈 줄 + 본문(비어있지 않은 줄 **최소 2줄**)
- type: `feat / fix / chore / docs / refactor / test / style / perf / build / ci / revert / init`
- subject 한글 허용 (예: `feat: 검색 기능 추가`)

## 설정 메모

- **TypeScript strict + `noUnusedLocals`/`noUnusedParameters` 활성화** — 사용하지 않는 import/변수는 빌드 차단.
- ESLint: `react-hooks/recommended` + `react-refresh` 규칙. `useEffect` deps 경고는 의도적 제외 외에는 무시 금지.
- 테스트 환경: vitest + jsdom + `@testing-library/react`. 전역 setup은 `src/test-setup.ts`(jest-dom matchers 등록). 테스트 파일은 아직 없음 — 추가 시 `*.test.ts(x)` 컨벤션.
- `db.json`은 시드 + 영속 저장소를 겸한다. `npm run dev` 중의 변경은 파일에 기록되므로 커밋 전 확인.
