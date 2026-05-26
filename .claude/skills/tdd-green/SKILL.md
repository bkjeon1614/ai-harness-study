---
name: tdd-green
description: >
  For a given GitHub issue number passed as $ARGUMENTS, take the FAILING
  tests already written by the tdd-red skill (under src/**/*.test.ts(x)
  and tracked as a checklist in docs/features/tag/issue-{N}.md) and write
  the MINIMUM implementation code that turns each failing test green —
  the GREEN step of TDD. Use when the user invokes /tdd-green SLASH
  command with an issue number, or asks to "make the failing tests
  pass for issue N", "GREEN 단계 진행", "최소 구현으로 테스트 통과시켜",
  "구현해서 테스트 통과", or any post-RED minimal-implementation task.
  Drives one failing test at a time through a tight feedback loop
  (write → npm test → fix → repeat, capped at 5 retries per test).
  Detects collect-phase failures (import resolves to missing module) and
  unblocks them by writing signature-only stubs so vitest can enumerate
  every test. Loads design context for UI work — docs/design-system/
  (single source of truth in this repo; falls back to docs/design-system.md
  if present), the "디자인 참고" section in the issue doc, and CLAUDE.md
  styling conventions — and applies the documented Tailwind tokens and
  layout when implementing components. Never modifies *.test.ts(x) files,
  never adds tests, never invents features the tests do not exercise,
  never adds visual elements outside the design spec. Final step runs
  `npx vitest run --coverage` for reference only and reports uncovered
  lines back to the developer without writing extra tests.
---

# TDD GREEN

`tdd-red` 단계에서 실패하는 테스트들이 작성되었다고 가정하고, **최소한의 구현 코드**로 해당 테스트들을 통과시킨다.
TDD의 GREEN 단계만 담당 — 새 테스트 작성, 리팩토링, 테스트가 요구하지 않는 기능 추가는 모두 다음 단계의 몫이다.

## Inputs

- `$ARGUMENTS` — GitHub 이슈 번호(필수, 정수). 예: `/tdd-green 2`
- 입력이 비어 있거나 정수가 아니면 즉시 중단하고 사용법(`/tdd-green <issue-number>`)을 안내한다. 사용자에게 이슈 번호를 재질의하지 않는다.
- 입력 스펙 파일: `docs/features/tag/issue-{N}.md`. 없거나 `## 테스트 시나리오` 섹션이 비어 있으면 즉시 중단하고 `/test-scenarios {N}` → `/tdd-red {N}` 선행을 안내한다.
- 입력 테스트 파일: `src/**/*.test.ts(x)` 중 이슈와 관련된 것들(`issue-{N}.md`의 체크리스트가 파일 경로를 알려준다).

## Hard rules (절대 위반 금지)

1. **`*.test.ts(x)` 파일 수정/삭제 금지** — 단언이 까다로워도 테스트를 고치지 않는다. 통과시킬 방법은 구현 변경뿐이다.
2. **새 테스트 추가 금지** — `it.todo` 포함 어떤 형태든. 커버리지를 올리기 위한 테스트도 금지(8단계 참조).
3. **테스트가 요구하지 않는 기능 구현 금지** — 시그니처/시나리오에 없는 helper, validation, fallback, 로깅을 "기왕 하는 김에" 끼워 넣지 않는다. YAGNI.
4. **불필요한 추상화 금지** — 일반화는 다음 리팩토링 단계에서. 지금은 inline if/return 으로도 충분.
5. **디자인 스펙 밖의 시각적 요소 추가 금지** — design 문서에 없는 색·간격·아이콘·애니메이션을 임의로 넣지 않는다. 테스트가 요구하지 않으면서 동시에 디자인 문서에도 없는 시각 요소 = 추가 금지.
6. **설정/시드 파일 수정 금지(원칙)** — `package.json`, vite/vitest 설정, `tsconfig.*`, `src/test-setup.ts`, `db.json`. 단, **Step 2의 스텁 파일 생성**과 **`db.json` 의 신규 필드 시드가 테스트 전제일 때**에 한해 예외이며, 두 경우 모두 보고에 명시한다.
7. **피드백 루프 5회 cap** — 같은 테스트에 대해 코드 수정 → `npm test` 를 5회 반복했음에도 RED가 풀리지 않으면 즉시 중단하고 사용자에게 원인 분석 결과를 보고. 무한 시도 금지.
8. **단계 합치기 금지** — 한 응답에 여러 단계 결과를 묶지 않는다. 각 단계 마일스톤이 보이게.

## 코드 컨벤션 (구현 시 강제)

이 프로젝트 `CLAUDE.md` 의 핵심 규칙을 그대로 따른다. 자주 어기는 항목만 다시:

- **컴포넌트는 named export + `export function` 함수 선언식.** `export default`, 화살표 함수 컴포넌트, `React.FC` 금지.
- **Props는 컴포넌트 바로 위 `interface ComponentNameProps`**, 비구조화로 받음.
- **자식이 부모 상태를 만지지 않는다** — props down + callback up. 콜백 prop `on*`, 핸들러 `handle*`.
- **서버 도메인 데이터는 Context, UI 모드/폼 입력은 `useState`**. Context에 UI 상태 넣지 않는다.
- **API fetch는 `src/api/<resource>.ts`에만.** 컴포넌트/Context에서 `fetch` 직접 호출 금지. `async/await` + `if (!res.ok) throw new Error('Failed to X')`.
- **mutation 동사 `create` / `update` / `delete` 통일**, API와 Context의 함수명·시그니처 1:1 일치.
- **`alert()` 금지**, 에러는 `console.error(message, err?)`.
- **타임스탬프(`createdAt`/`updatedAt`)는 API 레이어에서 ISO 문자열로 주입** — 서버 책임 아님.

## 디자인 컨텍스트 로드 (UI 구현 전 1회)

구현 대상 중 컴포넌트가 1개라도 있으면 **Step 4 이전에 한 번** 다음 순서로 읽고 머릿속에 적재한다 (없으면 건너뜀):

1. `docs/design-system/README.md` — 4대 핵심 원칙(No-Line / Surface Hierarchy / Glass & Gradient / Editorial Typography), 전역 Do/Don't.
2. `docs/design-system/CLAUDE.md` — 작업 트리거별 읽을 파일 매핑. 만들 컴포넌트의 카테고리에 해당하는 진입 경로를 따라간다.
3. `docs/design-system/tokens.md` — 사용할 색·spacing·typography·elevation 토큰의 raw 값과 매핑 상태.
4. `docs/design-system/components/<name>.md` — 해당 컴포넌트(또는 가장 가까운 카테고리: Button/Card/List/Input/Knowledge Token)의 사양. 1파일=1컴포넌트.
5. `docs/features/tag/issue-{N}.md` 의 "디자인 참고" 섹션(있을 때만).
6. `CLAUDE.md` 의 "스타일링" 섹션 — `@theme` 토큰 우선, `rounded-xl/2xl/3xl` 통일, 원시 색 클래스 금지.

**fallback 경로**: `docs/design-system/` 폴더가 통째로 없을 때만 `docs/design-system.md` 단일 파일을 찾는다. 둘 다 없으면 이 단계를 건너뛰고 `CLAUDE.md` 의 스타일링 컨벤션만 적용한다.

**적용 원칙**:

- `@theme` 에 정의된 의미 토큰(`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border` 등) 우선.
- 미정의 토큰은 인라인 hex (`bg-[#f1f4f6]`) 로 잠정 표현하고 보고에 "⚠️ 토큰화 필요" 메모.
- 원시 색 클래스(`bg-gray-500`, `text-blue-700`) 금지.
- 디자인 문서에 없는 시각 요소(그림자, 보더, 아이콘 등) 임의 추가 금지.

## Workflow (절대 순서)

### Step 0 — 입력 검증

- `$ARGUMENTS` 정수 확인. 아니면 즉시 중단 + 사용법 안내.
- `docs/features/tag/issue-{N}.md` 존재 + `## 테스트 시나리오` 섹션 비어 있지 않은지 확인. 미충족 시 즉시 중단 + 선행 스킬 안내.

### Step 1 — 실패 테스트 인벤토리 작성

`npm test` 1회 실행해서 결과를 수집한다 (백그라운드 X, 결과 확인 필요).

`issue-{N}.md` 의 **체크리스트(`- [ ]` / `- [x]`)** 항목을 전부 추출해 다음을 비교:

- 체크리스트 총 건수 (= `tdd-red` 가 작성하기로 한 `it()` 총 개수).
- `vitest` 가 보고한 `Tests` 총 개수 (`Tests N failed (N)` / `Tests N failed | M passed (T)`).

체크리스트는 단순한 진행표가 아니라 "이만큼의 `it()` 이 vitest 에 인식되어야 한다"는 계약. 사용자에게 이번 GREEN 작업으로 다룰 미체크 항목 목록을 1회 노출(합의 기록):

```
- [ ] (src/lib/search.test.ts) matchesQuery — should return true when ...
- [ ] (src/components/SearchBar.test.tsx) SearchBar — should render with ...
...
```

### Step 2 — Collect 실패 감지 + 스텁 처리

체크리스트 건수와 vitest `Tests` 수가 **불일치**하면 collect 단계에서 누락이 있다는 뜻. 가장 흔한 원인:

- 테스트 파일이 import 하는 모듈이 아직 존재하지 않는다 (예: `Failed to resolve import "./search" from "src/lib/search.test.ts"`).
- import 대상은 존재하나 해당 심볼이 export 되지 않았다 (`is not exported`, `is not a function`).

이때 한해 **시그니처만 있는 스텁 파일**을 만들어 vitest 가 전체 테스트를 인식하도록 한다. 스텁은 다음 원칙을 지킨다:

- `issue-{N}.md` 의 `## 시그니처` 섹션에 적힌 시그니처를 **그대로** 옮긴다 (반환 타입, 인자 타입 포함).
- 함수 본문은 `throw new Error('Not implemented');` 단 한 줄. 우연 통과 방지가 목적.
  ```ts
  export function matchesQuery(_note: Note, _query: string): boolean {
    throw new Error('Not implemented');
  }
  ```
- 컴포넌트 스텁은 `return null;` 대신 `throw new Error('Not implemented')` 가 안전(렌더 후 단언이 우연 통과할 수 있음).
- 훅 스텁은 호출 시 즉시 throw.
- 스텁 파일에는 **다른 helper, 상수, JSX 를 끼워 넣지 않는다.**

스텁 추가 후 `npm test` 다시 1회. 이번엔 collect 가 성공하고 모든 테스트가 **실행되어 실패**하는 상태(`Tests N failed (N)`)가 되어야 한다. 아니면 스텁 시그니처와 테스트가 기대하는 시그니처가 어긋난 것 — 사용자에게 보고하고 중단.

collect 가 처음부터 성공했으면 이 Step 은 건너뛴다.

### Step 3 — 디자인 컨텍스트 로드

위 "디자인 컨텍스트 로드" 섹션을 1회 수행. 컴포넌트가 전혀 없는 이슈(`src/lib/`, `src/api/`, `src/hooks/` 만 다루는 이슈)면 이 Step 은 건너뛴다.

### Step 4 — 첫 번째 실패 테스트 통과시키기

현재 실패 중인 테스트 중 **위에서부터 1개**를 선택한다(`issue-{N}.md` 체크리스트 순서 우선). 그 1개를 통과시키는 **최소 구현 코드**를 작성:

- 같은 `it()` 안에서 검증하는 동작만 만족시킨다. 다음 시나리오를 미리 만족시키지 않는다.
- 시그니처는 이미 Step 2 스텁에 있다 — 본문만 채운다. 시그니처가 없는 신규 함수면 `issue-{N}.md` 의 `## 시그니처` 그대로 사용.
- UI 작업이면 Step 3 에서 적재한 디자인 토큰/레이아웃을 그대로 적용. 토큰이 `@theme` 에 없으면 인라인 hex + ⚠️ 메모.
- 코드 컨벤션(named export, `interface XxxProps`, props down + callback up 등) 준수.

**금지**: 같은 파일에서 다음 시나리오에 대비한 분기/상수/helper 를 미리 추가.

### Step 5 — 피드백 루프 (해당 테스트만 우선, 끝에 전체 회귀)

작성 직후 `npx vitest run <테스트 파일 경로>` 1회. 결과별 처리:

- **해당 테스트 통과 + 다른 테스트 모두 그대로** → 이 파일 단독 GREEN. Step 5b 로.
- **해당 테스트 여전히 실패** → 에러 메시지/스택을 정확히 읽고 원인 분석. 코드 1회 수정 후 다시 vitest 실행. **최대 5회까지 반복.** 5회 안에 풀리지 않으면 즉시 중단 + 다음을 사용자에게 보고:
  - 시도 횟수와 매 회 변경 요약.
  - 마지막 에러 메시지.
  - 가설: 시나리오/시그니처/디자인 스펙 중 어느 쪽에 모호함이 있어 보이는지.
- **다른 테스트가 새로 깨졌다** → 회귀. 이번 변경의 어느 부분이 영향을 줬는지 분석. 회귀를 만든 변경을 좁혀 수정. 같은 5회 cap 적용.

**Step 5b — 전체 회귀 확인**: 해당 테스트가 통과하면 마지막에 `npm test` 1회. 회귀 없는지 확인. 회귀 있으면 Step 5 의 회귀 분기로 다시 진입.

### Step 6 — 체크리스트 갱신

`docs/features/tag/issue-{N}.md` 에서 해당 시나리오 항목을 `- [ ]` → `- [x]` 로 변경. 다른 텍스트(시나리오 문장, 카테고리, AC 매핑 표 등)는 손대지 않는다.

### Step 7 — 다음 실패 테스트로 이동

체크리스트의 다음 미체크 항목으로 가서 Step 4 부터 반복.
모든 항목이 `- [x]` 가 되고 `npm test` 가 전부 통과하면 Step 8 로.

### Step 8 — 커버리지 측정 (참고용)

`npx vitest run --coverage` 1회 실행.

- 출력에서 라인 / 함수 / 브랜치 커버리지와 **uncovered lines** 만 추출.
- 미커버 라인이 있으면 그 위치(파일:라인 범위)와 짧은 설명(어떤 분기/edge case 인지)을 사용자에게 보고.
- **누락된 시나리오로 보이는** 미커버에 한해 "테스트 시나리오에서 빠졌을 가능성이 있는 케이스"로 표시. 다음 단계(리팩토링 또는 새 RED) 에서 보강 여부 결정은 사용자.

**금지**: 커버리지를 올리기 위한 테스트/구현 추가. 이 단계는 측정과 보고만.

### Step 9 — 결과 요약

응답 마지막에 다음을 1줄씩 보고:

- 통과로 전환된 시나리오 수 / `issue-{N}.md` 전체 항목 수.
- 변경한 파일 목록 (경로 + 신규/수정 구분).
- 스텁 처리 여부(어떤 파일을 스텁으로 시작했는지).
- 디자인 컨텍스트 적용 여부 + 인라인 hex 로 잠정 처리한 토큰 목록(있다면).
- 전체 `npm test` 결과 (Total / Passed / Failed).
- 커버리지 요약 (Lines % / Functions % / Branches %) + 미커버 핫스팟 ≤ 5개.
- 5회 cap 으로 중단된 테스트가 있으면 강조해 명시.

작업 종료. 다음 단계(REFACTOR 또는 새 RED) 는 사용자가 별도 흐름으로 진행.

---

## 안티패턴 (하지 않는다)

- ❌ 단언이 까다로워서 테스트 파일을 수정한다 — Hard rule 1 위반.
- ❌ "통과시키기 쉬우니까" `it.skip` / `it.todo` 로 비활성화 — Hard rule 1·2 위반.
- ❌ 같은 함수에 다음 시나리오를 미리 만족시키는 분기 추가 — Hard rule 3 위반. (다음 RED 가 그 분기를 다시 요구할 때 추가.)
- ❌ 미커버 라인을 줄이려고 새 `it()` 추가 — Hard rule 2·Step 8 위반.
- ❌ 디자인 문서에 없는 그림자/보더/아이콘을 "예쁘니까" 추가 — Hard rule 5 위반.
- ❌ `package.json`, vite/vitest 설정, `tsconfig.*`, `src/test-setup.ts` 의 무단 수정 — Hard rule 6 위반.
- ❌ 같은 테스트를 5회 넘게 시도하면서 사용자 보고 없이 계속 변경 — Hard rule 7 위반.
- ❌ 한 응답에 "스텁 + 모든 시나리오 구현 + 커버리지 보고" 를 한꺼번에 묶기 — Hard rule 8 위반.
- ❌ 스텁 본문을 `return null` / `return ''` / `return []` 같은 빈값으로 만들기 — collect 통과를 위해 우연 통과를 만든다. `throw new Error('Not implemented')` 만 허용.
- ❌ `npm test` 결과 확인을 생략하고 "통과했을 것" 으로 기록.
- ❌ Step 8 에서 미커버를 본 뒤 임의로 RED 로 되돌아가 새 시나리오 추가 — 사용자 결정 사항이지 GREEN 의 역할이 아님.
