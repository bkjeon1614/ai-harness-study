---
name: security-review
description: >
  For a given GitHub issue number passed as $ARGUMENTS, run the
  post-refactor pre-commit safety gate: collect TypeScript errors
  (`npx tsc --noEmit`), npm vulnerabilities (`npm audit`), and direct
  `.env` variable leaks into `src/` (grep), then classify every finding
  into three buckets — 즉시 수정 필요 (build-failing or security risk),
  권장 수정 (quality smell), 무시 가능 (false positive or intentional)
  — and wait for developer approval before fixing. Use when the user
  invokes /security-review SLASH with an issue number, or asks to
  "보안 점검", "커밋 전 타입+취약점 점검", "tsc 와 npm audit 같이
  돌려줘", "환경변수 노출 검사", or any post-REFACTOR pre-commit gate
  task for the tag feature. Only fixes items in the 즉시 수정 필요
  bucket after approval; never touches 권장/무시 buckets without an
  explicit second request. Hard rules: never modify `*.test.ts(x)`,
  never run `npm audit fix --force` (transitive breaking), never bypass
  approval. Final step re-runs all three scans to confirm a clean
  state and reports remaining items per bucket.
---

# SECURITY REVIEW

`tdd-refactor` 단계까지 끝난 코드를 **커밋 직전 마지막 안전 게이트**로 점검한다.
타입 오류 + 의존성 취약점 + 환경변수 직접 노출 — 세 가지를 한 번에 수집해 분류하고, 진짜 막아야 할 것만 고친다.

## Inputs

- `$ARGUMENTS` — GitHub 이슈 번호(필수, 정수). 예: `/security-review 1`
- 입력이 비어 있거나 정수가 아니면 즉시 중단하고 사용법(`/security-review <issue-number>`)을 안내한다. 사용자에게 이슈 번호를 재질의하지 않는다.
- 입력 스펙 파일(참고용): `docs/features/tag/issue-{N}.md`. 분류 시 시그니처/시나리오를 참조해야 할 때 사용한다(없어도 진행 가능).
- 사전 조건: `npm test`는 통과 상태인 것이 자연스럽지만 이 스킬에서 강제 실행하지는 않는다(refactor 단계의 책임). 다만 `tsc --noEmit` 실패는 곧 빌드 실패이므로 무조건 즉시 수정 버킷.

## Hard rules (절대 위반 금지)

1. **테스트 파일 수정/삭제 금지** — `src/**/*.test.ts(x)`는 점검 결과로 잡혀도 손대지 않는다. 타입 오류가 테스트 파일에서 났으면 그 사유와 위치만 보고하고 사용자 결정에 맡긴다.
2. **`npm audit fix --force` 사용 금지** — semver-major 업그레이드를 강제해 trans-dep을 깨뜨린다. `npm audit fix`(non-breaking)만 허용하며, 그조차도 승인 후에만.
3. **승인 게이트 준수** — 분류 결과(Step 4)는 반드시 사용자 승인 후에만 수정 단계(Step 5)로 진입. 무시 가능 버킷에 들어간 항목을 사용자가 별도로 "이것도 같이"라고 지정하지 않는 한 절대 건드리지 않는다.
4. **부분 수정만 허용** — "즉시 수정 필요" 버킷만 자동 처리. "권장 수정"은 사용자가 명시적으로 추가 승인해야 처리한다.
5. **판단이 필요한 항목은 자동 수정 금지** — 의존성 메이저 업그레이드, 환경변수 정책 결정, 타입 시그니처 변경처럼 설계 판단이 들어가는 항목은 분류 시 "권장 수정" 또는 "무시 가능"으로 빼고 메모만 남긴다.
6. **`src/` 밖 수정 금지(원칙)** — `package.json`/`package-lock.json`은 `npm audit fix`(non-breaking) 한정 예외. 그 외 설정 파일(`vite.config.ts`, `tsconfig.*`, `.env*` 자체)은 절대 손대지 않는다.
7. **단계 합치기 금지** — 한 응답에 여러 단계 결과를 묶지 않는다. 각 단계 마일스톤이 보이게.
8. **재스캔 생략 금지** — 수정 후 반드시 Step 6 의 재스캔으로 클린 상태를 확인해 보고. "고쳤으니 통과했을 것"으로 기록하지 않는다.

## 분류 기준 (3-bucket 정의)

후보를 보고할 때 항상 이 세 버킷 중 하나로 라벨링한다. 모호하면 더 엄격한 쪽(즉시 수정 → 권장 → 무시)으로.

### 🔴 즉시 수정 필요 (Block commit)

- `npx tsc --noEmit` 에서 보고된 모든 에러(`error TS....`). 빌드 실패와 등가.
- `npm audit` 에서 `critical` 또는 `high` 등급이면서 `npm audit fix`(non-breaking)로 해결 가능한 항목.
- `src/` 코드(테스트 제외)가 `.env` 의 비밀값(API 키, 토큰, 시크릿)을 **import 또는 문자열 리터럴로 직접 참조**하는 경우.
- 클라이언트 번들에 들어가는 코드(`src/**`)가 `process.env.<SECRET>` 또는 `import.meta.env.<X>` 로 비밀값을 읽는 경우(Vite는 `VITE_` prefix만 클라이언트 노출 — prefix 없는 변수를 client 코드에서 읽으면 곧 빌드 실패 또는 정적 노출 위험).

### 🟡 권장 수정 (Quality smell)

- `npm audit` 의 `moderate` / `low` 등급, 또는 `high`인데 `npm audit fix`로는 해결 안 되고 메이저 업그레이드가 필요한 항목(판단 필요 → 사용자가 결정).
- `tsc` 가 통과해도 `any`/`unknown`/`@ts-ignore`/`@ts-expect-error`가 이번 이슈의 diff에서 새로 추가된 경우(grep).
- 클라이언트 코드가 환경변수를 사용하지만 `VITE_` prefix 가 붙어 의도적으로 노출되는 경우 — 정책상 OK여도 "공개돼도 되는 값인지" 재확인 메모.

### ⚪ 무시 가능 (False positive / intentional)

- dev-only 의존성(`devDependencies`)에서만 발생하고 빌드 산출물에는 포함되지 않는 `low`/`moderate` 취약점.
- `npm audit` 가 보고하지만 코드에서 실제로 호출되지 않는 패키지의 취약점(추적 확인 후).
- 이번 이슈 diff와 무관한 기존 부채.

각 항목은 (1) 버킷, (2) 출처(tsc/audit/grep), (3) 파일·라인 또는 패키지명·버전, (4) 한 줄 설명, (5) 권장 액션(자동 fix / 수동 / 무시)을 1~3줄로 정리.

## Workflow (절대 순서)

### Step 0 — 입력 검증

- `$ARGUMENTS` 정수 확인. 아니면 즉시 중단 + 사용법 안내.
- (선택) `docs/features/tag/issue-{N}.md` 존재 확인. 없으면 응답에 "스펙 문서 없음 — 분류는 일반 기준만 적용" 메모.

### Step 1 — 타입 점검: `npx tsc --noEmit`

`npx tsc --noEmit` 1회 실행(`run_in_background: true` 권장 — 대형 프로젝트에서 수십 초). 출력에서:

- 각 라인의 `path/to/file.ts(line,col): error TS....: <message>` 를 파싱.
- **테스트 파일(`*.test.ts(x)`)에서 난 에러도 수집은 하되 라벨에 "(test file — 수정 대상 아님)"** 표시.
- 에러 0건이면 "타입 클린" 1줄 보고.

### Step 2 — 취약점 점검: `npm audit`

`npm audit --json` 1회 실행(`run_in_background: true`). 출력에서:

- `metadata.vulnerabilities`의 `critical / high / moderate / low` 카운트 추출.
- 각 advisory의 패키지명·취약 버전·권장 버전·심각도·`fixAvailable`(true / 객체 / false) 를 파싱.
- `fixAvailable === true` 이면서 `critical`/`high` 인 항목은 → 즉시 수정 버킷.
- `fixAvailable` 가 객체(`{name, version, isSemVerMajor: true}`) 이면 → 권장 수정 버킷("메이저 업그레이드 필요").
- 0건이면 "취약점 0건" 1줄 보고.

### Step 3 — 환경변수 노출 점검 (grep)

다음 두 패턴을 `src/` 안에서 찾는다. 둘 다 **테스트 파일 제외**:

```bash
# Vite 클라이언트 코드에서 env 접근 — VITE_ prefix 없는 변수는 빌드 시점에 노출되거나 깨짐
grep -rn --include='*.ts' --include='*.tsx' --exclude='*.test.*' \
  -E 'process\.env\.[A-Z_]+|import\.meta\.env\.[A-Za-z_]+' src/

# .env 파일에서 정의된 변수명 추출 후, 그 이름이 src/에서 직접 문자열로 등장하는지
# (시크릿이 코드에 하드코딩된 경우)
```

- 매칭이 있으면 각 라인을 (파일:라인, 변수명, 컨텍스트 1줄) 형태로 수집.
- `VITE_` prefix 변수만 등장하고 모두 의도적 노출이면 → 권장 수정 버킷(메모만).
- prefix 없는 시크릿이 client 코드에서 읽히면 → 즉시 수정 버킷.
- 0건이면 "환경변수 직접 노출 없음" 1줄 보고. `.env` 파일이 프로젝트에 없으면 이 단계는 "N/A" 로 보고.

### Step 4 — 3-bucket 분류 보고 + 승인 게이트

Step 1~3 결과를 합쳐 위 분류 기준대로 **세 버킷**에 배치하고 사용자에게 그대로 노출. 응답을 그 단계에서 끊는다. 다음 정보를 함께 표시:

- 각 버킷 항목 수 (예: 🔴 3 / 🟡 5 / ⚪ 2).
- 각 항목의 (출처, 위치, 설명, 권장 액션).
- 자동 fix 가능 항목(`npm audit fix` non-breaking, 단순 타입 수정)과 수동 처리 항목 구분.
- 사용자가 **승인/부분 승인/거절** 중 무엇을 응답해야 다음 단계로 갈 수 있는지 명시. 기본값은 "🔴 전체 자동 수정 + 🟡 보고만". 🟡 도 같이 처리하려면 명시적 추가 승인 필요.

사용자가 응답하지 않은 상태에서 코드를 건드리지 않는다.

### Step 5 — "즉시 수정 필요" 처리

승인된 🔴 항목만 위에서부터 1개씩 처리. 각 1개에 대해:

1. **타입 에러** — 해당 파일에서 시그니처 또는 호출부를 수정. 외부 시그니처 변경이 필요해 보이면 중단 + 보고(이슈 스펙의 `## 시그니처`를 침범할 수 있음).
2. **취약점(npm audit fix)** — `npm audit fix`(non-breaking 한정)만 실행. `package-lock.json` 변경을 보고. `--force`는 금지.
3. **환경변수 노출** — `src/` 코드에서 비밀값 참조를 제거. 대체 방법(서버 측 proxy, `.env.local` + `VITE_` prefix 정책 재확인 등)이 필요하면 자동 수정 대신 보고로 끝낸다(설계 판단).
4. 각 항목 처리 직후 짧은 변경 요약(파일:라인 또는 패키지명) 1줄 보고. 다음 항목으로.

테스트 파일에서 잡힌 항목은 처리 대상 아님 — Hard rule 1.

### Step 6 — 재스캔 (Clean 확인)

승인된 🔴 항목을 모두 처리한 뒤, **Step 1~3 을 그대로 1회 더 실행**한다. 결과:

- 🔴 카운트가 0이면 "클린 상태" 보고.
- 0이 아니면 남은 항목을 다시 분류 보고하고 사용자에게 추가 결정 요청.

### Step 7 — 종료 보고

마지막 응답으로:

- 시작 시 / 종료 시 버킷별 카운트 (예: 🔴 3→0 / 🟡 5→5 / ⚪ 2→2).
- 처리된 항목 목록(파일/패키지 + 변경 요약).
- `package.json`/`package-lock.json` 변경 여부 — 있으면 커밋 직전 `npm install` 또는 `npm test` 재확인 권장 메모.
- 남은 🟡 / ⚪ 목록 — 다음 사이클(또는 별도 PR)에서 다룰 후보로 명시.
- (있다면) 자동 수정이 불가능했던 🔴 항목과 그 이유(설계 판단 필요, 메이저 업그레이드 필요 등).

작업 종료. 다음 단계(커밋 또는 PR 생성)는 사용자가 별도 흐름으로 진행.

---

## 안티패턴 (하지 않는다)

- ❌ 분류 보고 없이 곧장 `npm audit fix` 실행 — Hard rule 3 위반.
- ❌ `npm audit fix --force` 로 메이저 업그레이드 — Hard rule 2 위반. 의존성 트리가 깨진다.
- ❌ 🟡 또는 ⚪ 버킷 항목을 "기왕 하는 김에" 같이 수정 — Hard rule 4 위반.
- ❌ 테스트 파일의 타입 에러를 직접 수정 — Hard rule 1 위반. 보고만.
- ❌ `vite.config.ts` / `tsconfig.*` / `.env*` 파일을 임의로 수정 — Hard rule 6 위반.
- ❌ 시크릿이 client 코드에 있는 걸 발견하고도 ⚪ 무시 가능 으로 분류 — 분류 기준 위반. 즉시 수정 또는 최소한 권장 수정.
- ❌ 한 응답에 "스캔 + 분류 + 자동 수정 + 재스캔" 한꺼번에 묶기 — Hard rule 7 위반.
- ❌ Step 6 재스캔을 생략하고 "고쳤으니 클린" 으로 보고 — Hard rule 8 위반.
- ❌ `npm audit` 의 `low`/`moderate` 까지 자동 fix — 기본은 🟡 보고만. 사용자 명시 승인 시에만.
- ❌ 메이저 업그레이드 / 시그니처 변경처럼 판단이 필요한 항목을 자동 수정 — Hard rule 5 위반.
