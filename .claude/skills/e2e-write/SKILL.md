---
name: e2e-write
description: >
  For a given feature folder name passed as $ARGUMENTS (e.g. `tag`,
  `search`), read the user stories in
  `docs/features/{feature}/prd.md` (section `## 2. 사용자 스토리`,
  `### US-N. <title>` subsections, `**수용 기준 (AC)**` bullet lists)
  and turn them into Playwright E2E tests under
  `e2e/tests/{feature}.spec.ts`. Use when the user invokes the
  `/e2e-write` SLASH command with a feature name, or asks to
  "write E2E tests for the {feature} feature", "PRD 사용자 스토리를
  E2E 시나리오로 옮겨", "Playwright 테스트 만들어줘", "E2E 시나리오
  도출/작성", or any post-implementation end-to-end coverage task.
  Distinct from `/tdd-red` and `/tdd-green` which take an ISSUE
  NUMBER — this skill is a FEATURE-LEVEL concern (one E2E file per
  feature folder), not an issue-level concern. Enforces the test
  pyramid: skips ACs that are pure-function rules already covered
  by Vitest unit tests (e.g. trim/lowercase/dedup) and writes E2E
  only for cross-component user journeys — navigation, form ↔ list
  ↔ editor wiring, persistence across reload, server round-trip,
  error visibility. Uses the existing fixtures
  `e2e/fixtures/api.ts` (`resetDb`, `clearDb`, `seedDb`) and
  `e2e/fixtures/seed.ts` (`SEED_NOTES`) without recreating them.
  Hard human-approval gate before any test code is written — the
  scenario inventory (US-N → tentative test name → E2E or skip
  with reason) must be approved by the developer first.
---

# E2E WRITE

`docs/features/{feature}/prd.md` 의 **사용자 스토리(US-N)** + **수용 기준(AC)** 를 읽어, `e2e/tests/{feature}.spec.ts` 에 Playwright E2E 테스트를 작성한다.
이 skill 의 책임은 단 하나 — **유저 저니(end-to-end journey)** 만 커버하고, **단위 테스트가 이미 검증하는 순수 로직은 의도적으로 건너뛴다.**

## Inputs

- `$ARGUMENTS` — 기능 폴더명(필수, kebab-case). 예: `/e2e-write tag`, `/e2e-write search`.
  - 정수(이슈 번호) 가 들어오면 즉시 중단하고 안내한다. `/tdd-red` / `/tdd-green` 은 이슈 단위, 이 skill 은 **기능 단위**라는 차이를 명시.
- 입력 스펙 파일: `docs/features/{feature}/prd.md`.
- 입력 fixture(읽기 전용): `e2e/fixtures/api.ts`, `e2e/fixtures/seed.ts`, `e2e/global-setup.ts`, `e2e/global-teardown.ts`, `playwright.config.ts`.

## TDD 워크플로우와의 관계 (혼동 방지)

| skill / agent      | 입력            | 산출                              | 검증 입자        |
| ------------------ | --------------- | --------------------------------- | ---------------- |
| `/test-scenarios`  | 이슈 번호 (`N`) | `docs/features/.../issue-{N}.md`  | 함수·훅·컴포넌트 |
| `/tdd-red`         | 이슈 번호 (`N`) | `src/**/*.test.ts(x)` (실패)      | Vitest           |
| `/tdd-green`       | 이슈 번호 (`N`) | `src/**/*.ts(x)` (구현)           | Vitest           |
| `@ac-verifier`     | 이슈 번호 (`N`) | AC 충족 보고                      | Vitest + tsc     |
| `/tdd-refactor`    | 이슈 번호 (`N`) | `src/` 구조 개선                  | Vitest           |
| `/security-review` | 이슈 번호 (`N`) | tsc + audit + .env                | 빌드/보안        |
| **`/e2e-write`**   | **기능 폴더명** | **`e2e/tests/{feature}.spec.ts`** | **Playwright**   |

- E2E 는 **기능이 일정 부분 완성된 뒤** (보통 그 기능의 모든 이슈가 GREEN/머지된 후) 1회 도입한다. 이슈마다 E2E 를 늘리지 않는다.
- 본 skill 은 이슈 워크플로우의 7단계 안에 있지 않다. 별도의 **기능 종료 시 안전망** 역할.
- 사용자가 이슈 번호를 넣어 호출하면 (`/e2e-write 2`) 즉시 중단하고 `/e2e-write <feature-folder>` 사용법을 안내한다.

## Hard rules (절대 위반 금지)

1. **수정/생성 파일 화이트리스트** — `e2e/tests/{feature}.spec.ts` 단 하나(또는 분할 시 `e2e/tests/{feature}-<sub>.spec.ts`). 다음 파일은 **읽기 전용**:
   - `src/**/*` (구현/컴포넌트/타입) — **`data-testid` 추가도 금지.** 테스트 가능한 신호가 없으면 작성을 멈추고 사용자에게 보고.
   - `e2e/fixtures/api.ts`, `e2e/fixtures/seed.ts`, `e2e/global-setup.ts`, `e2e/global-teardown.ts`
   - `playwright.config.ts`, `package.json`, `tsconfig.*`, `db.json`
2. **`page.waitForTimeout` / `setTimeout` / `sleep` 금지.** 모든 대기는 Playwright 의 web-first auto-waiting 으로. `networkidle` 폴링도 금지. `page.waitForSelector` 는 다른 어떤 가시 신호도 없을 때만 마지막 수단으로 1회.
3. **테스트 간 의존 금지** — 모든 `test.describe` 블록에 `test.beforeEach(async () => { await resetDb(); })` 를 둔다. 한 테스트가 다른 테스트의 결과 상태를 가정하지 않는다.
4. **로케이터 우선순위 강제**:
   `getByRole({name})` > `getByPlaceholder` / `getByLabel` > `getByText` > `getByTestId` > CSS 선택자.
   기존 `[class*="rounded-2xl"]` 같은 클래스 기반은 grandfathered — **새로 추가 금지**. 접근성 라벨이 없으면 사용자에게 보고(`src/` 를 고치는 PR 은 별도).
5. **단위 테스트가 이미 커버하는 시나리오는 E2E 에 쓰지 않는다.** PRD AC 가 순수 로직(트림/대소문자 비교/중복 판정 등) 이면 `test.skip('...', () => {})` + 한 줄 코멘트 `// covered by unit test: <path>` 로 명시 스킵. 작성 자체를 생략하지 말 것 — 의도된 스킵임을 코드가 드러내야 한다.
6. **한 테스트 = 한 유저 저니.** Given–When–Then 구조로 1개 흐름. 한 `test(...)` 안에 5개 이상 클릭/3개 이상 별개 자산 검증이 모이면 분리한다.
7. **구현 디테일 단언 금지** — `page.evaluate()` 로 React state/hook 결과를 들여다보지 않는다. localStorage·window 객체 직접 검사 금지. UI 에 노출된 신호로만 단언.
8. **`test.only` / 미주석 `test.skip` 금지.** 커밋 직전 모두 제거. 스킵이 합법인 단 한 경우는 #5 의 "unit test 커버" 코멘트가 붙은 경우뿐.
9. **단계 합치기 금지** — 한 응답에 여러 단계 결과를 묶지 않는다. 파싱 → 인벤토리(승인 대기) → 테스트 1개씩 작성+실행 루프 → 최종 보고. 사용자 승인 게이트(Step 1 끝)를 건너뛰지 않는다.
10. **Hard rule 위반 감지 시 즉시 멈춤.** 회피 시도 금지. 사용자에게 보고하고 결정 위임.

## 테스트 파일 컨벤션 (강제)

- **위치**: `e2e/tests/{feature}.spec.ts` (kebab-case 단일 파일). 시나리오 수가 8 개를 넘으면 `e2e/tests/{feature}-{sub}.spec.ts` 로 분할(예: `tag-input.spec.ts`, `tag-list.spec.ts`).
- **헤더 boilerplate**:

  ```ts
  import { test, expect } from '@playwright/test';
  import { resetDb } from '../fixtures/api';

  test.describe('{feature}', () => {
    test.beforeEach(async () => {
      await resetDb();
    });

    // ... tests
  });
  ```

  - `clearDb` / `seedDb` 가 필요한 시나리오(예: 빈 상태 검증)면 그 테스트 안에서만 `await clearDb()` 추가. 전역에서 호출하지 않는다.

- **테스트 이름**: `'US-{N}: <한국어 저니 문장>'`. 사용자 스토리 제목과 1:1 매칭.
  - 예: `test('US-1: 사용자가 태그를 추가하면 chip 으로 표시된다', async ({ page }) => { ... })`
  - 같은 US 에 저니가 2개 이상이면 `'US-1a: ...'`, `'US-1b: ...'`.
- **`page.goto('/')` 는 매 테스트 본문 첫 줄에 명시.** `beforeEach` 에 넣지 않는다 — 라우팅이 다른 시나리오가 생길 때 깨지지 않도록.
- **단언은 `expect(locator).toBeVisible()` / `.toHaveText` / `.toHaveValue` / `.toHaveCount` 위주.** `expect(await locator.textContent())` 는 사용 금지(web-first 가 아님).
- **카운트 단언은 화면에 노출된 한국어 카피와 일치시킨다** — 기존 코드처럼 `expect(page.getByText('노트 3개')).toBeVisible()` 패턴.

### 코드 예시 (notes-crud.spec.ts 스타일과 일치)

```ts
import { test, expect } from '@playwright/test';
import { resetDb } from '../fixtures/api';

test.describe('tag', () => {
  test.beforeEach(async () => {
    await resetDb();
  });

  test('US-1: 사용자가 태그를 추가하면 chip 으로 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'TypeScript 제네릭 노트' }).click();

    await page.getByPlaceholder('태그 추가').fill('frontend');
    await page.getByPlaceholder('태그 추가').press('Enter');

    const tagArea = page.getByTestId('tag-area');
    await expect(tagArea.getByText('frontend')).toBeVisible();
  });

  // covered by unit test: src/lib/tag.test.ts (normalizeForCompare / isDuplicate)
  test.skip('US-1-AC: 같은 태그를 다시 입력하면 중복 추가되지 않는다 (silent)', () => {});
});
```

## Workflow (절대 순서)

### Step 0 — 입력 검증

- `$ARGUMENTS` 가 비어 있거나 공백뿐이면 사용법 안내 후 중단: `/e2e-write <feature-folder>`.
- `$ARGUMENTS` 가 정수면 "이 skill 은 이슈 번호가 아닌 기능 폴더명을 받는다" 안내 후 중단.
- 다음을 모두 확인. **하나라도 실패하면** 정확한 메시지로 중단:
  - `docs/features/{feature}/prd.md` 존재.
  - 같은 파일에 `## 2. 사용자 스토리` 섹션 존재 + 그 안에 `### US-` 로 시작하는 하위 섹션이 1개 이상.
  - `e2e/fixtures/api.ts`, `e2e/fixtures/seed.ts`, `e2e/global-setup.ts`, `e2e/global-teardown.ts`, `playwright.config.ts` 5 개 파일 모두 존재(없으면 skill 의 책임 범위 밖 — 사용자에게 환경 미비를 보고).
  - `e2e/tests/{feature}.spec.ts` 가 **이미 존재**하면 곧장 덮어쓰지 않는다. 사용자에게 (a) 이어 붙이기 (b) 백업 후 새로 작성 (c) 중단 중 선택 받기. 결정 전까지 어떤 쓰기도 하지 않는다.

### Step 1 — 사용자 스토리 → 시나리오 인벤토리 (사용자 승인 게이트)

1. `prd.md` 의 `## 2. 사용자 스토리` 섹션에서 모든 `### US-N. <title>` 블록과 그 아래 `**수용 기준 (AC)**` 항목을 추출.
2. 각 US 마다 최소 1개의 **happy path E2E 테스트** 를 배정. 별도 저니로 갈리는 AC 는 별도 테스트.
3. **AC 마다** 다음 중 하나로 분류:
   - `E2E` — 화면 간 이동, 컴포넌트 와이어링, 서버 라운드트립, 재로드 후 영속, 에러 표면 등 cross-component 저니. **유저 저니로 표현 가능한 것만 E2E 로 옮긴다.**
   - `skip — unit test` — 순수 함수 룰(트림/케이스/중복/정규화), 단일 훅 상태 전이, 단일 컴포넌트 prop 렌더. 코멘트로 매핑할 단위 테스트 경로 메모 (`src/lib/tag.test.ts` 등). **실제 그 경로의 테스트가 존재하는지 grep 으로 확인** — 없으면 "unit test 미작성" 으로 보고.
4. 다음 형식의 체크리스트를 1회 출력하고 **사용자 승인을 명시적으로 요청**:

   ```
   ## 시나리오 인벤토리 — feature: tag

   ### US-1. 태그 추가
   - [ ] (E2E) test('US-1: 사용자가 태그를 추가하면 chip 으로 표시된다')
         → AC1 "노트 편집 화면 안에서 태그를 입력하는 영역이 보인다"
         → AC4 "다단어 태그(`front end`)도 그대로 허용된다"
   - [ ] (skip — unit) AC2 "빈 값/공백만 입력 시 silent 무시"
         → covered by: src/hooks/useTagInput.test.ts (exists ✓)
   - [ ] (skip — unit) AC3 "이미 같은 태그가 있으면 중복 추가되지 않음 (silent)"
         → covered by: src/lib/tag.test.ts (isDuplicate, exists ✓)

   ### US-2. 태그 삭제
   - [ ] (E2E) test('US-2: 사용자가 chip 의 × 를 누르면 해당 태그만 사라진다')
         → AC1, AC2

   ### US-3. 태그 확인
   - [ ] (E2E) test('US-3: 저장된 태그가 노트를 다시 열 때 보인다')
         → AC1
   - [ ] (skip — unit) AC2 "태그 없는 노트는 빈 영역만 보인다"
         → covered by: e2e/tests/tags.spec.ts (이미 존재, 중복 작성 금지)

   ### US-4. 태그 저장
   - [ ] (E2E) test('US-4: 태그 변경은 저장 버튼을 눌러야 서버에 반영된다 (재로드 후 영속)')
         → AC1, AC2, AC3 통합 (cross-component round-trip)

   총 E2E 테스트: 4 / 스킵: 3 (모두 unit 커버 확인됨)
   ```

5. 사용자가 명시적으로 "승인" / "OK" / "진행" 류 응답을 줄 때까지 **어떤 테스트 코드도 쓰지 않는다.** 사용자가 항목 조정(추가/삭제/이름 변경)을 요청하면 인벤토리를 갱신해 다시 출력한다.

### Step 2 — 한 테스트씩 작성 → 즉시 실행

승인된 인벤토리 위에서 위→아래로 순회. 항목마다:

1. `e2e/tests/{feature}.spec.ts` 가 없으면 헤더 boilerplate(위 §테스트 파일 컨벤션) 로 새로 만든다.
2. 인벤토리의 **첫 미체크 항목** 하나만 `test(...)` 로 추가. 스킵 항목은 `test.skip(...)` + 코멘트 1줄로 처리.
3. **즉시 실행**(백그라운드 X — 결과를 보고 다음으로 가야 함):

   ```
   npx playwright test e2e/tests/{feature}.spec.ts -g "<방금 추가한 test 이름>"
   ```

4. 결과 해석:
   - **Pass** — 정상. 인벤토리 체크 처리 후 다음 항목.
   - **Fail (구현 미완)** — 기능이 아직 GREEN 이 아닐 수 있음. 사용자에게 (a) RED 보존하고 계속 (이슈 워크플로우 진행 중인 경우) (b) 중단하고 보고 중 선택 받기. 임의로 단언을 약화시키지 않는다.
   - **Fail (셀렉터 미존재)** — `src/` 에 접근성 라벨 / 텍스트 / testid 가 부재. **`src/` 를 수정하지 말고** 즉시 중단해 사용자에게 보고 ("`'태그 추가'` placeholder 가 src/components/TagInput.tsx 에 없음 — 별도 PR 로 추가 필요").
   - **Flake (간헐적 실패)** — 동일 명령 2회 추가 실행. 그래도 흔들리면 중단해 보고 — `setTimeout`/`waitForTimeout` 으로 가리지 않는다.
5. 한 응답에 1~3개 테스트 추가 → 실행 → 보고 까지만. 인벤토리 전체를 한 응답에 몰지 않는다.

### Step 3 — 전체 파일 재실행

모든 인벤토리 항목을 처리한 뒤:

```
npm run test:e2e -- e2e/tests/{feature}.spec.ts
```

- 모든 신규 테스트가 의도한 상태(통상 모두 pass; 기능 RED 단계라면 의도된 fail) 인지 확인.
- 기존 다른 `*.spec.ts` 가 깨지지 않았는지도 사용자에게 확인 권유: `npm run test:e2e` 전체 1회 (백그라운드로 실행해도 됨, `run_in_background: true`).
- 통과/실패 카운트와 실패 위치를 1줄씩 보고.

### Step 4 — 최종 보고

응답 마지막에 다음 형식으로 마무리:

```
## E2E 작성 완료 — feature: {feature}

생성/수정 파일:
- e2e/tests/{feature}.spec.ts (테스트 N개 추가)

US ↔ test 매핑:
- US-1 → 'US-1: 사용자가 태그를 추가하면 chip 으로 표시된다' (pass)
- US-2 → 'US-2: 사용자가 chip 의 × 를 누르면 해당 태그만 사라진다' (pass)
- US-3 → 'US-3: 저장된 태그가 노트를 다시 열 때 보인다' (pass)
- US-4 → 'US-4: 태그 변경은 저장 버튼을 눌러야 서버에 반영된다' (pass)

스킵된 AC (단위 테스트가 커버):
- US-1 AC2 → src/hooks/useTagInput.test.ts
- US-1 AC3 → src/lib/tag.test.ts
- US-3 AC2 → e2e/tests/tags.spec.ts (선행 작업 중복 회피)

실행 결과: 4 passed / 0 failed / 3 skipped (의도된 스킵)

다음 단계(권장):
- src/ 에 접근성 라벨 보강이 필요한 부분이 있다면 별도 PR 로 진행.
- 이 feature 의 PRD 가 갱신되면 본 skill 을 재실행해 인벤토리 차이만 추가.
```

작업 종료. 이 skill 은 다음 단계를 자동 호출하지 않는다.

## 단위 테스트 ↔ E2E 분리 가이드 (테스트 피라미드)

| 검증 대상                          | 어디에서 검증           | E2E 작성 여부 |
| ---------------------------------- | ----------------------- | ------------- |
| 순수 함수(`trim`, `dedup`, 정규화) | `src/lib/*.test.ts`     | ❌ 스킵       |
| 훅의 상태 전이(`useTagInput.add`)  | `src/hooks/*.test.ts`   | ❌ 스킵       |
| 단일 dumb 컴포넌트 prop 렌더       | `src/components/*.test` | ❌ 스킵       |
| 에러 메시지 텍스트 자체            | unit                    | ❌ 스킵       |
| 화면 간 이동(클릭 → 다른 패널)     | E2E                     | ✅            |
| 폼 ↔ 리스트 ↔ 에디터 와이어링      | E2E                     | ✅            |
| 서버 라운드트립(저장 후 새로고침)  | E2E                     | ✅            |
| 빈/로딩/에러 상태의 사용자 표면    | E2E                     | ✅            |
| 키보드 흐름(Enter 로 태그 확정)    | E2E (저니 시) ✅        |               |

**판단 기준 한 줄**: "이 검증을 위해 두 개 이상의 컴포넌트/Context/서버 호출이 협력해야 하나?" → Yes 면 E2E, No 면 unit.

## 안티패턴 (하지 않는다)

- ❌ `src/lib/*.test.ts` 가 이미 커버하는 룰(`trim`, `lowercase` 비교, 중복 판정)을 E2E 로 다시 검증.
- ❌ 한 `test(...)` 안에 5+ 단언으로 여러 유저 스토리를 묶기 — "the kitchen sink test".
- ❌ `page.evaluate()` 로 React state, hook 반환값, Context 내부를 들여다보기.
- ❌ `localStorage` / `sessionStorage` / `window.__INTERNAL__` 같은 내부 저장소 직접 검사.
- ❌ `await page.waitForTimeout(500)` — 결정성 손상의 첫 번째 원인.
- ❌ `await new Promise(r => setTimeout(r, ...))` 같은 자체 sleep.
- ❌ `await page.waitForLoadState('networkidle')` 으로 "왠지 안정될 때까지" 기다리기.
- ❌ `src/` 에 `data-testid` 를 임의로 추가. 필요하면 멈춰서 사용자에게 보고.
- ❌ 새 fixture/setup 파일 작성, `e2e/global-*.ts` 수정, `playwright.config.ts` 수정.
- ❌ `page.locator('.text-red-500')` / `page.locator('button.bg-tertiary')` 같은 Tailwind 클래스 셀렉터 — 기존 grandfathered 외에는 금지.
- ❌ "어차피 이전 테스트가 노트를 만들었으니 `resetDb()` 생략" — 테스트 간 결합.
- ❌ 인벤토리(Step 1) 출력 없이 곧장 코드 작성. 사용자 승인 게이트 우회.
- ❌ 한 응답에 인벤토리 + 모든 테스트 + 보고를 묶기. 마일스톤이 보여야 한다.
- ❌ 실패한 테스트를 `expect.soft` / `try-catch` 로 감춰서 "통과시키기".
- ❌ `test.only` / 사유 없는 `test.skip` 을 커밋에 남기기.
