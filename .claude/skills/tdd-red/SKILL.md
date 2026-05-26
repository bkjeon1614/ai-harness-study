---
name: tdd-red
description: >
  For a given GitHub issue number passed as $ARGUMENTS, take the approved
  signatures + classified test scenarios already written to
  docs/features/tag/issue-{N}.md (by the test-scenarios skill) and turn
  them into FAILING test code — the RED step of TDD. Use when the user
  invokes /tdd-red SLASH command with an issue number, or asks to
  "write failing tests for issue N", "RED 단계 진행", "시나리오를
  실패하는 테스트로 작성", "Vitest 테스트 만들어줘 (RED)", or any
  pre-implementation failing-test-authoring task for the tag feature.
  Writes Vitest + React Testing Library test files only, co-located with
  the target source file (src/api/tags.ts → src/api/tags.test.ts,
  src/components/TagInput.tsx → src/components/TagInput.test.tsx).
  Confirms each new test fails for the right reason before moving on,
  then runs `npm test` at the end to verify every test in the issue
  fails. Does NOT modify any file under src/ other than newly-created
  *.test.ts(x) files — implementation code is strictly out of scope and
  belongs to the next (GREEN) step. Test names use the
  "should [expected] when [condition]" convention; describe blocks group
  by function/component.
---

# TDD RED

승인된 시그니처 + 분류된 시나리오(`docs/features/tag/issue-{N}.md`)를 **실패하는 테스트 코드**로 옮긴다.
TDD의 RED 단계만 담당 — 구현 코드는 작성하지 않는다.

## Inputs

- `$ARGUMENTS` — GitHub 이슈 번호(필수, 정수). 예: `/tdd-red 2`
- 입력이 비어 있거나 정수가 아니면 즉시 중단하고 사용법(`/tdd-red <issue-number>`)을 안내한다. 사용자에게 이슈 번호를 재질의하지 않는다.
- 입력 스펙 파일: `docs/features/tag/issue-{N}.md`. 없거나 `## 시그니처` / `## 테스트 시나리오` / `### AC 커버리지 매핑` 섹션이 비어 있으면 즉시 중단하고 사용자에게 `/test-scenarios {N}` 선행을 안내한다.

## Hard rules (절대 위반 금지)

1. **테스트 파일 외 어떤 파일도 생성/수정 금지** — `src/**/*.test.ts(x)` 신규 작성/수정만 허용. `src/`의 구현 파일(`*.ts`, `*.tsx` 중 `.test.` 가 아닌 모든 것), `db.json`, `package.json`, vite/vitest 설정, `src/test-setup.ts` 어떤 것도 손대지 않는다.
2. **구현 코드 작성 금지** — 테스트가 import하는 모듈이 존재하지 않아도 만들지 않는다. 그 import 실패가 곧 RED 신호.
3. **테스트는 반드시 실패해야 한다** — "한 번도 실패한 적 없는 테스트는 통과한 적도 없는 테스트". 작성 직후 실행해서 실패를 직접 확인한다.
4. **승인된 시나리오 문장과 1:1 매칭** — `issue-{N}.md`의 시나리오 항목 개수 = 작성하는 `it()` 개수. 누락도, 임의 추가도 금지.
5. **시나리오 문장 = `it()` 이름** — `[정상|경계|예외]` 태그를 제거한 나머지 `should ... when ...` 문구를 `it()` 첫 인자로 그대로 사용. (단위 prefix 예: `useTagInput.addTag — should X when Y` → describe `useTagInput.addTag` + it `should X when Y`).
6. **시나리오 1개 = 즉시 실행 1회** — 작성 → 해당 파일만 vitest 실행(`npx vitest run <path>`) → 실패 확인 → 다음 시나리오로. 묶어서 끝낸 뒤 한꺼번에 돌리지 않는다.
7. **단계 합치기 금지** — 한 응답에 여러 단계의 결과를 묶지 않는다. 각 단계 마일스톤이 보이게.

## 테스트 파일 컨벤션 (강제)

- **위치**: 테스트 대상 파일과 **같은 디렉토리**.
  - `src/api/tags.ts` → `src/api/tags.test.ts`
  - `src/lib/tag.ts` → `src/lib/tag.test.ts`
  - `src/hooks/useTagInput.ts` → `src/hooks/useTagInput.test.ts`
  - `src/context/NotesContext.tsx` → `src/context/NotesContext.test.tsx`
  - `src/components/TagInput.tsx` → `src/components/TagInput.test.tsx`
- **확장자**: 대상이 `.tsx`(JSX 포함)면 `*.test.tsx`, 그 외 `*.test.ts`.
- **describe 블록**: 함수/컴포넌트(또는 훅 메서드) 단위. 한 파일에 여러 단위가 있으면 nested describe 가능.
  ```ts
  describe('addTag', () => {
    it('should ...', () => {
      /* ... */
    });
  });
  ```
- **it 이름**: `should [기대 동작] when [조건]` (시나리오 문장에서 `[분류]`와 단위 prefix를 제거한 그대로).
- **AAA 코멘트 금지** — `// arrange / // act / // assert` 같은 의식 주석은 넣지 않는다. 변수명·블록 구조로 충분히 드러나면 그걸로 끝.
- **mock·setup 최소화** — 새 테스트가 통과해 버릴 위험이 생기지 않는 선에서만. fetch 의존 코드는 `vi.spyOn(global, 'fetch')` 정도로 stub. `src/test-setup.ts`는 이미 `@testing-library/jest-dom`을 로드하므로 추가 setup 파일을 만들지 않는다.

## 테스트 종류별 코드 패턴 (참고)

### 순수 함수 (`src/lib/*.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { matchesQuery } from './search';

describe('matchesQuery', () => {
  it('should return true when query is a substring of title (case-sensitive same)', () => {
    expect(matchesQuery({ title: 'React Hooks', content: '' }, 'React')).toBe(true);
  });
});
```

- import 경로는 **상대 경로**(`./search`) — 현재 코드베이스에 path alias 없음.
- 시그니처가 throw 없이 boolean을 반환하는 함수면 `expect(fn(...)).toBe(...)` 패턴 우선. `toEqual`은 객체/배열 비교에만.

### 커스텀훅 (`src/hooks/use*.ts`)

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTagInput } from './useTagInput';

describe('useTagInput.addTag', () => {
  it('should append trimmed tag and clear inputValue when inputValue is non-empty and unique', () => {
    let next: string[] = [];
    const { result } = renderHook(() => useTagInput({ value: [], onChange: (v) => (next = v) }));
    act(() => result.current.setInputValue('react'));
    act(() => result.current.addTag());
    expect(next).toEqual(['react']);
    expect(result.current.inputValue).toBe('');
  });
});
```

- 훅이 컴포넌트와 무관하면 파일 확장자 `.test.ts`도 가능하나, JSX(`<Wrapper>`)가 등장하면 `.test.tsx` 사용.

### 컴포넌트 (`src/components/*.tsx`)

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('should render existing tags as chips when value contains tags', () => {
    render(<TagInput value={['react', 'vite']} onChange={() => {}} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('vite')).toBeInTheDocument();
  });
});
```

- 사용자 입력 시 `userEvent` 우선(키보드/포커스 시뮬레이션이 정확). `fireEvent`는 부득이할 때만.
- `@testing-library/user-event` 가 devDependencies에 없으면 추가 설치하지 말고, 우선 `fireEvent.keyDown` 등으로 작성 후 별도 안내 메모를 응답 끝에 남긴다(설치는 사용자 권한).
- 비동기 결과는 `findBy*` / `waitFor` 사용. `await new Promise(...)` 같은 sleep 금지.

### API 레이어 (`src/api/*.ts`)

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTags } from './tags';

describe('fetchTags', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 't1', name: 'react' }]), { status: 200 }),
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('should return parsed tag array when server responds 200', async () => {
    await expect(fetchTags()).resolves.toEqual([{ id: 't1', name: 'react' }]);
  });
});
```

- `API_URL`이 `http://localhost:3001`로 하드코딩되어 있는 코드베이스 사정상 fetch 자체를 spy/mock 한다. MSW 같은 추가 도구는 도입하지 않는다(설정 변경 금지 룰).

## Workflow (절대 순서)

### Step 0 — 입력 검증

- `$ARGUMENTS` 정수 확인. 아니면 즉시 중단 + 사용법 안내.
- `docs/features/tag/issue-{N}.md` 존재 + 필수 섹션(`## 시그니처`, `## 테스트 시나리오`, `### AC 커버리지 매핑`) 비어 있지 않은지 확인. 미충족 시 즉시 중단 + `/test-scenarios {N}` 선행 안내.

### Step 1 — 시나리오 인벤토리 작성

`issue-{N}.md`에서 시나리오 항목을 전부 추출해 다음 형태의 **체크리스트**를 만든다 (사용자에게도 1회 노출 — 합의 기록):

```
- [ ] (src/lib/search.test.ts) matchesQuery — should return true when ...
- [ ] (src/lib/search.test.ts) matchesQuery — should return true when ...
- [ ] (src/components/SearchBar.test.tsx) SearchBar — should render with ...
...
```

- 단위 prefix(`matchesQuery`, `useTagInput.addTag`, `SearchBar`)로 **테스트 파일 경로**를 결정.
- 같은 파일 안의 시나리오는 같은 describe 안에 모은다(필요시 nested).
- 시나리오 개수와 체크리스트 항목 개수가 정확히 일치하는지 확인.

### Step 2 — 한 시나리오씩 RED

체크리스트 위에서 아래로 순회. 항목마다:

1. 해당 테스트 파일이 없으면 새로 만든다(파일 상단 import + `describe` 헤더).
2. 시나리오에 대응하는 `it('should ... when ...', () => { ... })` 1개만 추가.
3. **즉시 실행** — `npx vitest run <테스트 파일 경로>` (백그라운드 X, 결과 확인 필요).
4. 실패 메시지 확인:
   - 기대하는 실패 형태(미존재 모듈/심볼: `Failed to resolve import "./tags"`, `is not a function`, `is not exported` 등 / 또는 `expect(...).toBe()` 단언 실패). 통과해버리면 즉시 멈추고 원인 분석(시나리오와 단언이 어긋났거나, 구현 일부가 이미 있어 우연히 통과한 경우 — 사용자에게 보고).
5. 체크리스트 항목 체크 처리(`- [x]`), 다음 시나리오로.

**금지**: 한 번에 여러 `it()`을 몰아 작성하고 나중에 한꺼번에 실행. 시나리오마다 즉시 실행해 RED 확인.

### Step 3 — 전체 `npm test`

모든 시나리오를 옮긴 뒤 `npm test` 1회 실행:

- 모든 신규 테스트가 **실패** 상태인지 확인.
- 통과한 테스트가 하나라도 있으면 그 위치를 보고하고 사용자에게 알린다. 임의로 단언을 강화하거나 시나리오를 수정하지 않는다.
- 기존 통과 테스트가 깨졌다면(테스트 파일 추가만으로 깨질 일은 없어야 정상), 그것도 보고.

### Step 4 — 보고

응답 마지막에 다음을 1줄씩 보고:

- 생성한 테스트 파일 목록 (경로).
- 시나리오 항목 수 = 작성한 `it()` 수 (일치 여부).
- `npm test` 결과 요약: 총 N개 / 실패 N개 / 통과 0개(이상적).
- (있다면) 통과해버린 테스트, 누락한 시나리오, 추가 설치가 필요한 패키지(`@testing-library/user-event` 등) 메모.

작업 종료. 다음 단계(GREEN: 최소 구현)는 사용자가 별도 흐름으로 진행.

---

## 안티패턴 (하지 않는다)

- ❌ 테스트가 통과하도록 import 누락 모듈을 `src/`에 만든다 — RED를 위조하는 행위.
- ❌ `expect(true).toBe(true)` 같은 placeholder 단언 — 시나리오 문장과 무관한 단언.
- ❌ `it.skip` / `it.todo` / `it.only` 사용 — 모든 시나리오는 실제로 실행되어야 한다.
- ❌ `try/catch`로 에러를 삼킨 뒤 `expect(true)` — throw 검증은 `expect(() => fn()).toThrow()` 또는 `await expect(p).rejects.toThrow()`.
- ❌ `vitest.config.ts` / `tsconfig.*` / `package.json` / `src/test-setup.ts` 변경.
- ❌ 시나리오에 없는 테스트를 "기왕 하는 김에" 추가.
- ❌ "RED는 분명한데 실행은 생략" — 직접 실행해 화면에 실패가 찍힌 걸 확인.
- ❌ 한 응답에 시나리오 인벤토리 + 모든 테스트 작성 + 결과 보고를 한꺼번에 묶기.
