---
name: test-scenarios
description: >
  For a given GitHub issue number passed as $ARGUMENTS, walk through a
  strict 7-step pre-TDD workflow that locks down function and component
  signatures and derives classified test scenarios (정상 / 경계 / 예외),
  written to docs/features/tag/issue-N.md as the spec the developer will
  implement against. Use when the user invokes /test-scenarios SLASH
  command with an issue number, or asks to "derive test scenarios for
  issue N", "lock signatures before TDD", "prepare a pre-TDD spec for
  the tag feature", "분류된 테스트 시나리오 뽑아줘", "TDD 입력 만들어줘",
  or any pre-TDD signature + scenario derivation task. Does NOT write
  implementation or test code — signatures and scenario sentence lists
  only. Requires two developer approval gates (signatures, then
  scenarios) before finalizing. Reads the GitHub issue body, docs/features
  PRD, and existing codebase patterns to keep new signatures consistent
  with src/api/notes.ts, src/context/NotesContext.tsx, src/types/note.ts,
  and the component Props convention defined in CLAUDE.md.
---

# Test Scenarios

GitHub 이슈 1개에 대해 **시그니처 → 시나리오** 순으로 TDD 입력을 준비한다.
**구현 코드/테스트 코드는 절대 작성하지 않는다** — 시그니처(타입 선언) + 분류된 시나리오 문장만 산출.

## Inputs

- `$ARGUMENTS` — GitHub 이슈 번호(필수, 정수). 예: `/test-scenarios 2`
- 입력이 비어 있거나 정수가 아니면 즉시 중단하고 사용자에게 알린다. 이슈 번호를 사용자에게 다시 묻지 않는다.

## Hard rules (절대 위반 금지)

1. **구현 코드 작성 금지** — 함수 본체, 훅 내부 로직, JSX, 어떤 형태의 실행 코드도 작성하지 않는다. 타입 선언과 시그니처만.
2. **테스트 코드 작성 금지** — `it()`, `test()`, `describe()`, `expect()` 등 어떤 테스트 프레임워크 블록도 작성하지 않는다. 시나리오는 자연어 문장으로만.
3. **Step 2 / Step 7 GATE 준수** — 사용자의 명시적 승인을 받기 전 다음 단계로 진행하지 않는다. 자동 진행 금지.
4. **기존 코드 컨벤션 준수** — `src/api/notes.ts`(API 패턴), `src/context/NotesContext.tsx`(Context mutation 1:1), `src/types/note.ts`(타입), `src/components/`(컴포넌트 Props), `CLAUDE.md` 전역 룰.
5. **출력 파일 고정** — 항상 `docs/features/tag/issue-{N}.md` (N은 이슈 번호). 신규 생성 또는 기존 덮어쓰기. 다른 경로에 저장 금지.
6. **단계 합치기 금지** — 한 응답에 여러 단계의 결과를 묶어 발표하지 않는다. 각 단계 끝에 마일스톤이 보이게.

## Workflow (7단계, 순서 변경 금지)

### Step 1 — 시그니처 확정

읽어야 할 입력:

- `gh issue view $ARGUMENTS` — 제목, 본문, AC 추출
- `docs/features/tag/prd.md` — ADR 결정 사항, 데이터 모델
- `docs/features/tag/spec-fixed.md` — 기술 결정 세부
- `docs/features/tag/issues.md` — 해당 이슈의 스코프
- 관련 코드: `src/api/notes.ts`, `src/context/NotesContext.tsx`, `src/types/note.ts`, `src/components/`, `src/hooks/`(있다면), `src/lib/`(있다면)

도출할 시그니처 4종:

**(a) 순수 함수 시그니처** — 위치 `src/lib/<domain>.ts`. 형식:

```ts
export function <name>(<arg>: <Type>): <ReturnType>;
```

**(b) 커스텀훅 시그니처** — 위치 `src/hooks/use<Name>.ts`. 형식:

```ts
interface Use<Name>Args { /* ... */ }
interface Use<Name>Result { /* ... */ }
export function use<Name>(args: Use<Name>Args): Use<Name>Result;
```

**(c) 컴포넌트 Props 타입** — 컴포넌트 파일 바로 위. 형식:

```ts
interface <Name>Props { /* ... */ }
export function <Name>(props: <Name>Props): JSX.Element;
```

콜백 prop은 `on` + 동사 (`onSelect`, `onSubmit` 등 — `CLAUDE.md` 네이밍 룰).

**(d) 에러 케이스 명세** — 각 함수/훅별로 "어떤 입력/상황에서 throw 또는 silent 무시"인지 정의. 형식:

```
<함수명> — <조건>일 때 <throw|silent 무시>
예: useTagInput.addTag — trim 후 빈 문자열이면 silent 무시 (throw 없음)
```

**금지**: 함수 본체, 훅 내부 로직, JSX, 테스트 코드.

### Step 2 — 시그니처 검토/승인 (🚦 GATE)

도출한 시그니처를 사용자에게 보여주고 **명시적 승인**을 받는다. 형식 예:

```ts
// src/lib/tag.ts
export function normalizeForCompare(input: string): string;
export function sanitizeForStore(input: string): string;
export function isDuplicate(input: string, existing: string[]): boolean;

// src/hooks/useTagInput.ts
interface UseTagInputArgs {
  value: string[];
  onChange: (next: string[]) => void;
}
interface UseTagInputResult {
  inputValue: string;
  setInputValue: (v: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
}
export function useTagInput(args: UseTagInputArgs): UseTagInputResult;
```

🚦 **승인을 받기 전 Step 3로 진행하지 않는다.** 사용자가 수정 요청하면 반영 후 다시 보여준다. "이대로 OK", "확정", "승인" 같은 명시적 응답을 기다린다.

### Step 3 — 시그니처를 `docs/features/tag/issue-{N}.md` 상단에 기록

파일이 없으면 생성, 있으면 기존 시그니처 섹션을 덮어쓴다. 파일 헤더 구조:

```markdown
# Issue #{N} — {Title from gh issue view}

> 본 문서는 `/test-scenarios` 스킬로 작성된 시그니처 + 테스트 시나리오.
> TDD 구현(테스트 먼저 → 실패 확인 → 최소 구현)의 입력으로 사용한다.

## 시그니처

### 순수 함수

(Step 1의 (a))

### 커스텀훅

(Step 1의 (b))

### 컴포넌트 Props

(Step 1의 (c))

### 에러 케이스

(Step 1의 (d))
```

### Step 4 — 시나리오 도출

각 시그니처마다 3분류로 시나리오를 도출:

| 분류       | 의미                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| **[정상]** | 기대대로 동작하는 happy path                                               |
| **[경계]** | 입력 경계값/특수값 (빈 입력, 0개, 1개, 최대, trim 후 빈, 대소문자 경계 등) |
| **[예외]** | 에러 throw, silent 무시, 잘못된 사용 등                                    |

**형식 (필수)**: `[정상|경계|예외] <함수명 또는 단위> — should <기대동작> when <조건>`

예시:

- `[정상] normalizeForCompare — should return lowercased trimmed string when given mixed-case input with whitespace`
- `[경계] normalizeForCompare — should return empty string when given only whitespace`
- `[정상] useTagInput.addTag — should append trimmed tag and clear inputValue when inputValue is non-empty and unique`
- `[경계] useTagInput.addTag — should be no-op when inputValue trims to empty`
- `[예외] useTagInput.addTag — should silent-ignore (no throw, no append) when tag is case-insensitive duplicate of existing`

**금지**: 실제 테스트 코드, `expect()` 호출, mock 코드 등.

### Step 5 — 시나리오를 `docs/features/tag/issue-{N}.md` 하단에 추가

파일에 다음 섹션을 append (또는 기존 섹션 덮어쓰기):

```markdown
## 테스트 시나리오

### <단위 1: 예 — 순수 함수 normalizeForCompare>

- [정상] ... — should ... when ...
- [경계] ... — should ... when ...
- [예외] ... — should ... when ...

### <단위 2: 예 — 커스텀훅 useTagInput.addTag>

- [정상] ...
- [경계] ...
- [예외] ...
```

### Step 6 — AC 교차 검증

`gh issue view $ARGUMENTS` 로 AC 목록을 다시 읽고, 각 `AC-N.N`이 **최소 1개 시나리오로 커버**되는지 확인. 파일 하단에 AC 매핑 표 추가:

```markdown
### AC 커버리지 매핑

| AC     | 커버 시나리오                    |
| ------ | -------------------------------- |
| AC-1.1 | [정상] xxx — should ... when ... |
| AC-1.2 | [경계] yyy — should ... when ... |
| AC-1.3 | [정상] zzz, [예외] zzz           |
```

커버 안 된 AC가 있으면 **시나리오를 보강**하고 매핑 표 갱신. 모든 AC가 ≥1개 시나리오에 매핑돼야 Step 7 진행.

### Step 7 — 시나리오 검토/승인 (🚦 GATE)

최종 시나리오 + AC 매핑 표를 사용자에게 보여주고 **명시적 승인**을 받는다.

🚦 **승인 전까지 후속 작업(테스트 코드 작성, 다른 이슈 처리 등) 진행 금지.** 사용자가 수정 요청하면 갱신 후 다시 보여준다.

승인되면 작업 종료. 다음 단계(테스트 코드 작성·구현)는 사용자가 별도 TDD 흐름으로 진행.

---

## 출력 파일 최종 구조 (Step 3 + 5 + 6 누적)

```markdown
# Issue #{N} — {Title}

> 본 문서는 ...

## 시그니처

### 순수 함수

### 커스텀훅

### 컴포넌트 Props

### 에러 케이스

## 테스트 시나리오

### <단위 1>

### <단위 2>

### AC 커버리지 매핑

| AC | 커버 시나리오 |
```

---

## 안티패턴 (하지 않는다)

- ❌ 시그니처 또는 시나리오 응답에 함수 본체·`it()`·`expect()` 작성.
- ❌ Step 2 / Step 7 GATE 건너뛰고 자동 진행.
- ❌ `docs/features/tag/issue-{N}.md` 외 다른 경로에 결과 저장.
- ❌ AC 미커버 상태로 Step 7 진입.
- ❌ 이슈 번호가 빠졌을 때 사용자에게 다시 묻기 — 즉시 중단 후 사용법 안내(`/test-scenarios <issue-number>`).
- ❌ 한 응답에 여러 단계 결과 묶기 — 각 단계 마일스톤이 명확히 보이게.
- ❌ 기존 시그니처/시나리오를 사용자 합의 없이 임의로 바꾸기 (덮어쓰기는 사용자 요청 시에만).
