---
name: tdd-refactor
description: >
  For a given GitHub issue number passed as $ARGUMENTS, take the GREEN
  codebase from tdd-green (all tests passing) and improve structure
  WITHOUT changing behavior — the REFACTOR step of TDD. Use when the
  user invokes /tdd-refactor SLASH with an issue number, or asks to
  "refactor issue N while keeping tests green", "REFACTOR 단계 진행",
  "테스트 통과 유지하면서 리팩토링", "구조 개선만 해줘", or any
  post-GREEN code-quality task. Scopes changes strictly to files in
  `git diff main...HEAD --name-only -- src/` minus `*.test.ts(x)`.
  Reads `CLAUDE.md` first for project conventions, then proposes
  candidates against five axes — duplication, naming clarity, single
  responsibility, unnecessary complexity, CLAUDE.md convention drift —
  and waits for developer approval. Drives one change at a time through
  `npm test`; on failure rolls back immediately. Never adds features,
  never modifies test files, never touches files outside `src/` or the
  diff scope. Final step reports a before/after summary.
---

# TDD REFACTOR

`tdd-green` 단계에서 **모든 테스트가 통과하는 상태**가 만들어졌다고 가정하고, **행동(behavior)을 바꾸지 않은 채 구조만 개선**한다.
TDD의 REFACTOR 단계만 담당 — 새 기능, 새 테스트, 시그니처 변경(=공개 API 변경), 테스트가 요구하지 않는 동작 추가는 모두 다음 사이클(다음 RED)의 몫이다.

## Inputs

- `$ARGUMENTS` — GitHub 이슈 번호(필수, 정수). 예: `/tdd-refactor 2`
- 입력이 비어 있거나 정수가 아니면 즉시 중단하고 사용법(`/tdd-refactor <issue-number>`)을 안내한다. 사용자에게 이슈 번호를 재질의하지 않는다.
- 입력 스펙 파일(참고용): `docs/features/tag/issue-{N}.md`. 없어도 진행은 가능하지만, 시그니처/시나리오를 참조해야 할 때 사용한다.
- 사전 조건: `npm test`가 **모두 통과**하는 상태여야 한다. 시작 시점에 1개라도 실패하면 즉시 중단하고 `/tdd-green {N}` 선행을 안내한다.

## Hard rules (절대 위반 금지)

1. **테스트 파일 수정/삭제 금지** — `src/**/*.test.ts(x)`는 읽기만. 단언이 까다로워 보여도 절대 손대지 않는다. (다음 RED 사이클에서 시나리오 보강은 별개 작업.)
2. **`src/` 밖의 어떤 파일도 수정 금지** — `package.json`, vite/vitest 설정, `tsconfig.*`, `src/test-setup.ts`, `db.json`, 문서, CI 설정 어떤 것도 손대지 않는다.
3. **이번 이슈의 변경 범위(diff scope) 밖 수정 금지** — `git diff main...HEAD --name-only -- src/` 결과에서 `*.test.ts(x)`를 뺀 파일 집합만 대상. 그 밖의 파일을 "기왕 하는 김에" 정리하지 않는다.
4. **새 기능 / 새 동작 / 새 분기 추가 금지** — REFACTOR는 **행동 보존 변환(behavior-preserving transformation)**만 수행. 새 validation, fallback, 로깅, edge-case 처리 모두 금지.
5. **새 테스트 추가 금지** — `it.todo` 포함 어떤 형태든. 커버리지를 올리기 위한 테스트도 금지.
6. **공개 시그니처 변경 금지(원칙)** — `issue-{N}.md` `## 시그니처`에 못박힌 함수/컴포넌트/훅의 외부 시그니처는 그대로. 내부에서 추출한 helper의 시그니처는 자유. 외부 시그니처를 꼭 바꿔야 할 합리적인 이유가 있으면 **변경하지 말고 사용자에게 보고**한 뒤 다음 사이클로 미룬다.
7. **하나의 변경 → 즉시 `npm test`** — 묶어서 끝낸 뒤 한꺼번에 돌리지 않는다. 한 단위 변경마다 회귀 확인.
8. **회귀 시 즉시 롤백** — 1회 수정으로 통과 복구가 명확하지 않으면 그 변경을 통째로 되돌리고 다른 접근을 시도. "조금만 더 고치면 될 것 같다"는 금지.
9. **승인 게이트 준수** — 후보 리스트(Step 4)는 반드시 사용자 승인 후에만 실행 단계로 진입. 임의로 리팩토링을 먼저 시작하지 않는다.
10. **단계 합치기 금지** — 한 응답에 여러 단계 결과를 묶지 않는다. 각 단계 마일스톤이 보이게.

## 범용 점검 기준 (이 5축으로만 본다)

후보 식별 시 사용하는 고정 체크리스트. 이 5축 밖의 변경(예: 새 기능, 디자인 스펙 밖 시각 변경, 시그니처 변경)은 후보로 올리지 않는다.

1. **중복 제거(Duplication)** — 같은 로직/표현/문자열 상수가 2회 이상 반복되는가. 추출 비용보다 가독성 이득이 큰가.
2. **네이밍 명확성(Naming clarity)** — 변수/함수/타입 이름이 의도를 드러내는가. `data`, `tmp`, `handle`처럼 의미 없는 이름이 남아있지 않은가. 코드 컨벤션의 prefix 규칙(`on*` / `handle*` / `is*`)을 따르는가.
3. **단일 책임(Single responsibility)** — 한 함수/컴포넌트가 입력 검증 + 변환 + 부수효과를 모두 하고 있지 않은가. 컴포넌트가 fetch + 폼 상태 + 렌더링을 동시에 들고 있지 않은가.
4. **불필요한 복잡도(Unnecessary complexity)** — 매직 넘버, 3단 이상 중첩, 일찍 도입한 추상화(`useFactory`, generic helper), 죽은 코드, `eslint-disable` 남발.
5. **CLAUDE.md 컨벤션 불일치(Convention drift)** — 컴포넌트 named export 누락, `React.FC` 사용, 컴포넌트가 직접 `fetch` 호출, `alert()` 사용, 원시 색 클래스(`bg-gray-500`) 등 프로젝트 규칙 위반.

각 후보 항목은 (1) 어떤 축에 해당하는지, (2) 어느 파일의 어느 위치인지, (3) 어떤 변경을 제안하는지를 1~2줄로 적는다.

## CLAUDE.md 컨벤션 (리팩토링 시 강제)

이 프로젝트 `CLAUDE.md`의 규칙은 곧 축 5번의 판정 기준이다. 자주 어기는 항목만 다시:

- **컴포넌트는 named export + `export function` 함수 선언식.** `export default`, 화살표 함수 컴포넌트, `React.FC` 금지.
- **Props는 컴포넌트 바로 위 `interface ComponentNameProps`**, 비구조화로 받음.
- **자식이 부모 상태를 만지지 않는다** — props down + callback up. 콜백 prop `on*`, 핸들러 `handle*`.
- **서버 도메인 데이터는 Context, UI 모드/폼 입력은 `useState`**. Context에 UI 상태 넣지 않는다.
- **API fetch는 `src/api/<resource>.ts`에만.** 컴포넌트/Context에서 `fetch` 직접 호출 금지. `async/await` + `if (!res.ok) throw new Error('Failed to X')`.
- **mutation 동사 `create` / `update` / `delete` 통일**, API와 Context의 함수명·시그니처 1:1 일치.
- **`alert()` 금지**, 에러는 `console.error(message, err?)`.
- **타임스탬프(`createdAt`/`updatedAt`)는 API 레이어에서 ISO 문자열로 주입** — 서버 책임 아님.
- **원시 색 클래스 금지** — `@theme`의 의미 토큰 우선. 미정의는 인라인 hex + ⚠️ 메모.

## Workflow (절대 순서)

### Step 0 — 입력 검증

- `$ARGUMENTS` 정수 확인. 아니면 즉시 중단 + 사용법 안내.
- (선택) `docs/features/tag/issue-{N}.md` 존재 확인. 없어도 진행 가능하지만 응답에 "스펙 문서 없음 — 시그니처 보존 판단은 git diff와 코드만으로 수행" 메모.

### Step 1 — CLAUDE.md 적재

`CLAUDE.md`를 1회 읽어 다음을 적재한다:

- 네이밍 규칙 (PascalCase / camelCase / `on*` / `handle*` / `is*`)
- 컴포넌트 패턴 (named export, 함수 선언식, `interface ComponentNameProps`)
- API/Context 경계 (fetch는 `src/api/`에만)
- 스타일링 규칙 (`@theme` 토큰 우선, 원시 색 금지, `rounded-xl/2xl/3xl`)
- 명시된 "남아있는 일관성 결함" 섹션 — 알려진 부채는 후보 우선순위에 반영

`CLAUDE.md`가 없거나 비어 있으면 즉시 중단 + 사용자에게 보고. 범용 5축만으로 진행하는 것은 이 스킬의 설계 의도가 아니다.

### Step 2 — 사전 GREEN 확인

`npm test` 1회 실행(백그라운드 X, 결과 확인 필요).

- 모든 테스트가 통과(`Tests N passed (N)`)해야 다음 단계로. 1개라도 실패면 즉시 중단 + `/tdd-green {N}` 선행 안내.
- 통과한 테스트 총 개수(`baseline`)를 기록 — Step 6/7에서 회귀 판정 기준.

### Step 3 — 리팩토링 대상 파일 식별

`git diff main...HEAD --name-only -- src/` 1회 실행(백그라운드 X). 출력에서:

- `*.test.ts` / `*.test.tsx`를 **제외**.
- 삭제된 파일(`D` 상태)도 **제외**.
- 남은 파일이 **이번 작업의 전체 후보 풀**.

후보 풀이 비어 있으면(예: 이슈가 테스트만 추가했거나 main이 곧 HEAD) 즉시 중단 + 사용자에게 "리팩토링할 src 변경이 없음" 보고.

후보 풀의 각 파일을 읽고 **5축 점검 기준**에 따라 항목을 뽑는다. 항목 형식:

```
- [축 1: 중복] src/components/TagInput.tsx:42-58
  → addTag와 removeTag가 같은 trim+validate 시퀀스를 중복. lib/tag.ts에 normalizeTagName으로 추출 제안.
- [축 5: 컨벤션] src/api/tags.ts:14
  → API_URL이 'http://localhost:3001/tags'로 하드코딩. notes.ts와 동일한 패턴(`const API_URL = 'http://localhost:3001'`)으로 정렬 제안.
```

### Step 4 — 후보 목록 보고 + 승인 게이트

Step 3에서 뽑은 후보를 **사용자에게 그대로 노출**하고 응답을 그 단계에서 끊는다. 다음 정보를 함께 표시:

- 후보 총 개수.
- 각 후보의 (축, 파일, 위치, 제안).
- 권장 적용 순서(영향 작은 것 → 큰 것). 예: 네이밍 → 중복 추출 → 컴포넌트 분할.
- 사용자가 **승인/부분 승인/거절** 중 무엇을 응답해야 다음 단계로 갈 수 있는지 명시.

사용자가 응답하지 않은 상태에서 코드를 건드리지 않는다. 부분 승인이면 승인된 항목만 Step 5로 진입.

### Step 5 — 한 변경 → 한 테스트 (반복)

승인된 항목을 위에서부터 1개씩 처리한다. 각 1개에 대해:

1. **변경 적용** — 가능한 한 작은 diff. 한 항목 안에서 여러 파일을 만지더라도 의미상 1개의 변환이어야 한다.
2. **즉시 `npm test`** 1회 실행(백그라운드 X, 결과 확인 필요).
3. 결과 분기:
   - **이전과 동일하게 N개 통과** → 이 항목 GREEN 유지. Step 6(해당 항목 단위)로.
   - **1개라도 실패** → 즉시 그 변경을 통째로 롤백(`git restore` 또는 Edit 역수정). `npm test`로 baseline 복구 확인. 같은 항목을 **다른 접근으로 1회만** 재시도 가능 — 재시도도 실패하면 그 항목을 **스킵**으로 표시하고 다음 항목으로. 같은 항목을 3회 이상 시도하지 않는다.
4. 새 helper / 새 hook / 새 컴포넌트 파일을 만든다면 위치/네이밍을 `CLAUDE.md`와 기존 구조에 맞춘다(`src/lib/*.ts`, `src/hooks/use*.ts`, `src/components/*.tsx`).

**금지**: 항목 여러 개를 묶어 한 번에 변경한 뒤 마지막에 한 번만 `npm test`. 회귀 원인 추적이 불가능해진다.

### Step 6 — 항목 단위 정리

각 항목이 끝날 때마다:

- 변경한 파일 경로와 한 줄 요약(`before → after` 형태).
- `npm test` 결과(통과 수 동일한지).
- 롤백/스킵된 경우 사유 1줄.

이 정보를 다음 항목 진입 전에 응답으로 노출.

### Step 7 — 전체 종료 보고

승인된 모든 항목을 처리한 뒤(또는 사용자가 중단 요청한 뒤) 마지막 응답으로:

- 시작 시 baseline 테스트 수 vs. 종료 시 테스트 수 (반드시 동일해야 정상).
- 적용된 항목 / 스킵된 항목 / 롤백된 항목 카운트.
- 변경된 파일 목록(경로 + 한 줄 변경 요약).
- 신규 생성/이동된 파일이 있다면 별도 표시(예: `src/lib/tag.ts (new)`).
- 미해결로 남은 후보(스킵 또는 사용자가 부분 승인에서 뺀 항목) — 다음 사이클에서 다시 검토할 후보로 명시.
- (있다면) 외부 시그니처 변경이 필요해 보였으나 보존한 항목 — 다음 RED 사이클 입력으로 사용자에게 제안.

작업 종료. 다음 단계(새 RED 또는 PR 정리)는 사용자가 별도 흐름으로 진행.

---

## 안티패턴 (하지 않는다)

- ❌ 후보 보고 없이 곧장 코드 수정 — Hard rule 9 위반.
- ❌ 한 응답에 "후보 + 전체 적용 + 결과 보고"를 한꺼번에 묶기 — Hard rule 10 위반.
- ❌ "어차피 같은 PR이니까" git diff 범위 밖 파일까지 정리 — Hard rule 3 위반.
- ❌ 단언이 까다로워서 / 테스트가 실패해서 `*.test.ts(x)`를 수정 — Hard rule 1 위반.
- ❌ 리팩토링 중 새 fallback / 새 validation / 새 분기를 끼워 넣기 — Hard rule 4 위반.
- ❌ 회귀가 났는데 "한 줄만 더 고치면 될 것 같다"고 같은 변경을 계속 누적 — Hard rule 8 위반. 즉시 롤백.
- ❌ 외부 시그니처(공개 함수 인자/반환 타입, 컴포넌트 Props)를 임의로 변경 — Hard rule 6 위반. 보고 후 다음 사이클로.
- ❌ `package.json` / vite/vitest 설정 / `tsconfig.*` / `src/test-setup.ts` / `db.json` 변경 — Hard rule 2 위반.
- ❌ 5축 밖의 변경(시각 디자인 개선, 새 기능, 성능 최적화를 위한 아키텍처 변경)을 후보로 올림 — 점검 기준 위반.
- ❌ 미해결로 남은 후보를 보고에서 누락 — 다음 사이클이 같은 문제를 또 발견하게 된다.
- ❌ "통과했을 것"으로 가정하고 `npm test` 결과 확인을 생략.
