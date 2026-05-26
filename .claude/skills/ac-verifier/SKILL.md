---
name: ac-verifier
description: >
  For a given GitHub issue number passed as $ARGUMENTS, perform a
  READ-ONLY verification of whether each Acceptance Criterion in
  `docs/features/tag/issue-{N}.md` is satisfied by the current code +
  tests. Use when the user invokes /ac-verifier SLASH with an issue
  number, or asks to "AC 검증", "이슈 N 의 완료조건 충족 여부 점검",
  "verify ACs for issue N", or any post-GREEN AC compliance check.
  Parses the `### AC 커버리지 매핑` table to extract AC ↔ scenario
  pairs, runs `npm test` + `npx tsc --noEmit` once, and judges each
  AC: ✅ when all mapped scenarios pass, ❌ when any fails, ⚠️ when
  partially covered or skipped. Compile-time ACs (e.g., TS strict) are
  judged by `tsc` exit code. Never modifies source, test, spec, or
  config files — strictly read-only. Output: per-AC status + failed
  scenario file:line + recommended next action (`/tdd-red`,
  `/tdd-green`, `/test-scenarios`) for each unmet AC.
---

# AC VERIFIER

`docs/features/tag/issue-{N}.md` 에 명시된 Acceptance Criteria 가 **현재 코드/테스트로 실제 충족되는지** 읽기 전용으로 검증한다.
어떤 파일도 수정하지 않으며, 결과 보고만 한다. 미충족 시 어느 다음 스킬(`/tdd-red` / `/tdd-green` / `/test-scenarios`) 이 필요한지 안내.

## Inputs

- `$ARGUMENTS` — GitHub 이슈 번호(필수, 정수). 예: `/ac-verifier 2`
- 입력이 비어 있거나 정수가 아니면 즉시 중단하고 사용법(`/ac-verifier <issue-number>`)을 안내한다. 사용자에게 이슈 번호를 재질의하지 않는다.
- 입력 스펙 파일: `docs/features/tag/issue-{N}.md`. 없거나 `### AC 커버리지 매핑` 섹션이 비어 있으면 즉시 중단 + `/test-scenarios {N}` 선행 안내.

## Hard rules (절대 위반 금지)

1. **읽기 전용** — `src/`, `*.test.ts(x)`, `docs/features/tag/issue-{N}.md`, `package.json`, vite/vitest 설정, `tsconfig.*`, `src/test-setup.ts`, `db.json` 어떤 파일도 수정하지 않는다. 보고만.
2. **새 테스트 / 새 시나리오 / 새 구현 추가 금지** — 미충족 발견 시에도 직접 고치지 않는다. 다른 스킬에게 위임 안내.
3. **AC 매핑 표가 단일 진실** — `### AC 커버리지 매핑` 표에 없는 AC 는 검증 대상 아님. 표가 비어있으면 즉시 중단 + `/test-scenarios {N}` 선행 안내.
4. **시나리오 매핑은 텍스트 그대로 비교** — AC 매핑 표의 시나리오 문장과 vitest 의 `it()` 이름이 1:1 일치하지 않으면 ⚠️ "매핑 모호" 로 분류. 임의로 fuzzy match 하지 않는다.
5. **컴파일 시점 검증 AC 는 `tsc` 결과만 사용** — 매핑 표에 "TS strict 컴파일 강제" 같이 명시된 AC 는 `npx tsc --noEmit` 종료 코드 0 → ✅, 비-0 → ❌. 별도 단언/테스트로 추가 검증하지 않는다.
6. **단계 합치기 금지** — 한 응답에 여러 단계 결과를 묶지 않는다. 각 단계 마일스톤이 보이게.
7. **결과 보고 시 사실만** — vitest 실패 메시지, tsc 에러는 출력 그대로 인용. 가설/추측을 사실처럼 단정하지 않는다 ("~로 보임" 같은 추측 라벨 사용).

## Workflow (절대 순서)

### Step 0 — 입력 검증

- `$ARGUMENTS` 정수 확인. 아니면 즉시 중단 + 사용법 안내.
- `docs/features/tag/issue-{N}.md` 존재 + `### AC 커버리지 매핑` 섹션 존재 + 표 행 1개 이상 확인. 미충족 시 즉시 중단 + `/test-scenarios {N}` 선행 안내.

### Step 1 — AC ↔ 시나리오 매핑 추출

`docs/features/tag/issue-{N}.md` 의 `### AC 커버리지 매핑` 표를 파싱:

```
| AC | 커버 시나리오 |
| --- | --- |
| AC-1.1 — ... | [경계] xxx — should ... when ... |
| AC-1.2 — ... | [정상] yyy — should ... when ... · TS strict 컴파일 강제 |
| AC-1.3 — ... | [정상] zzz — should ... when ... · [경계] aaa — should ... when ... |
```

각 행에서:

- AC 식별자 (`AC-N.N`) + 설명 추출.
- 우측 셀에서 `·` 또는 줄바꿈으로 구분된 **각 시나리오 문장** 분리.
- 시나리오 문장에서 `[분류]` 태그를 제거하고 `should ... when ...` 부분을 vitest `it()` 이름 후보로 보관.
- "TS strict 컴파일 강제", "수동 검증", "vitest 범위 밖" 같은 **non-test 검증 라벨**도 별도 분류로 보관.

추출 결과를 사용자에게 1회 노출 (합의 기록):

```
[AC 매핑 인벤토리]
- AC-1.1 → [vitest] "should include a tags array on every note entry in the seed data"
- AC-1.2 → [tsc] TS strict 컴파일 강제 · [vitest] "should call createNote with tags as an empty array ..."
- AC-1.3 → [vitest] "should render existing tags as chips ..."
- ...
```

### Step 2 — 테스트 실행 (vitest + tsc)

다음을 1회씩 실행:

- `npm test` — 전체 vitest 결과 수집. 각 `it()` 의 통과/실패 + 실패 메시지 + 파일:라인.
- `npx tsc --noEmit` — 종료 코드 + 에러 라인 수집.

**주의**: 백그라운드 실행 OK 지만 두 결과 모두 본 단계 종료 전에 확인 완료해야 함. 결과 미확인 상태로 Step 3 진입 금지.

### Step 3 — AC 별 충족도 판정

Step 1 의 각 AC 에 대해 매핑된 시나리오 / non-test 라벨을 모아 판정:

| 상태         | 조건                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| ✅           | 매핑된 vitest 시나리오 **전부 통과** + (있다면) 매핑된 tsc 검증 통과                                                                |
| ❌           | 매핑된 vitest 시나리오 중 **1개 이상 실패**, 또는 tsc 검증이 실패                                                                   |
| ⚠️ 매핑 모호 | vitest 가 인식한 `it()` 중 매핑 표의 시나리오 문장과 정확히 일치하는 것을 찾을 수 없음 (collect 실패 / 이름 불일치 / 시나리오 누락) |
| ⚠️ 부분 충족 | 매핑이 여러 개인데 일부만 통과·일부 skip (skip 은 RED 미수행 신호)                                                                  |
| ⚠️ 검증 불가 | "수동 검증", "vitest 범위 밖" 등 자동 검증 불가 라벨만 매핑된 AC. 별도 표시.                                                        |

판정 시 vitest 결과의 `it()` 이름 매칭은 **공백/구두점만 정규화** 한 1:1 비교. 의미 유사도로 fuzzy match 하지 않는다 (Hard rule 4).

### Step 4 — 보고

응답 마지막에 다음 표 + 부록을 출력:

```
| AC | 상태 | 매핑 시나리오 (요약) | 실패/모호 사유 | 권장 액션 |
| --- | --- | --- | --- | --- |
| AC-1.1 | ✅ | seed shape | — | — |
| AC-1.2 | ❌ | tsc + NoteEditor.createNote | tsc 0 errors (✅) · NoteEditor: createNote called without tags | /tdd-green {N} |
| AC-1.3 | ❌ | NoteEditor chips render | getByText('react') not found at NoteEditor.test.tsx:41 | /tdd-green {N} |
| AC-1.4 | ⚠️ 부분 충족 | TagList empty (3건 중 2건 통과) | TagList 1건 collect 실패 | /tdd-green {N} (스텁 처리) |
| AC-1.5 | ⚠️ 매핑 모호 | NoteEditor switch | 매핑 표 시나리오 문장이 vitest 인식 it() 와 정확히 일치 안 함 | /test-scenarios {N} (매핑 갱신) |
```

부록:

- 시작 시 vitest baseline (Total / Passed / Failed) + tsc 결과 (0 errors 또는 N errors).
- 자동 검증 불가 AC 목록 (있을 때만, "수동 확인 필요" 명시).
- 전체 AC 충족률 (예: 1/5 ✅ / 2/5 ❌ / 2/5 ⚠️).

권장 액션 매핑 규칙:

| 사유                                           | 권장 액션                                          |
| ---------------------------------------------- | -------------------------------------------------- |
| vitest 시나리오 실패 (구현 미완료)             | `/tdd-green {N}`                                   |
| 매핑 표 시나리오가 vitest 에 없음 (RED 미수행) | `/tdd-red {N}`                                     |
| 매핑 표 자체에 시나리오 누락 / 문구 불일치     | `/test-scenarios {N}` (Step 4~6 갱신)              |
| tsc 에러                                       | `/tdd-green {N}` 또는 직접 타입 수정 (사용자 판단) |
| 수동 검증 라벨                                 | 사용자가 직접 확인                                 |

작업 종료. 다른 스킬 호출은 사용자가 별도 진행.

---

## 안티패턴 (하지 않는다)

- ❌ 미충족 AC 발견 시 직접 src/ 또는 테스트 수정 — Hard rule 1·2 위반.
- ❌ 매핑 표에 없는 AC 를 임의로 검증 — Hard rule 3 위반.
- ❌ vitest `it()` 이름과 매핑 표 시나리오 문장의 의미 유사도로 fuzzy match — Hard rule 4 위반. 정확 일치만.
- ❌ 컴파일 시점 검증 AC 에 별도 단언/테스트 추가 — Hard rule 5 위반.
- ❌ 한 응답에 "매핑 추출 + 테스트 실행 + 판정 + 보고" 를 한꺼번에 묶기 — Hard rule 6 위반.
- ❌ "이 AC 는 통과로 보임" 같이 vitest 결과 미확인 상태에서 추측 단정 — Hard rule 7 위반.
- ❌ AC 충족 여부 결과로 `issue-{N}.md` 의 매핑 표를 갱신 — 표는 spec 이지 결과 로그 아님. 사용자가 별도로 정리.
- ❌ vitest 가 실패해서 docs 또는 시나리오를 사용자 합의 없이 수정 — 결과 보고만.
- ❌ `npm test` 결과 확인을 생략하고 "전부 통과했을 것" 으로 가정.
