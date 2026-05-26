# 태그 기능 정의서 (확정본)

> 원본: [`spec-original.md`](./spec-original.md)
> 이 문서는 원본의 모호한 부분을 인터뷰로 확정한 결과를 담는다. 구현은 이 문서를 기준으로 한다.

## 기능 개요

노트에 태그를 추가/삭제하고, 노트 상세 화면(`NoteEditor`)에서 태그 목록을 확인할 수 있다.

## 기능 요구사항

- `NoteEditor` 에서 노트에 태그를 추가할 수 있다.
- `NoteEditor` 에서 노트에 추가된 태그를 삭제할 수 있다.
- 태그 목록은 **`NoteEditor` 안에서만** 표시한다. (`NoteList` 등 다른 곳에는 표시하지 않음 — 추후 확장 시 별도 스펙으로 다룬다.)

## 데이터 구조 — Q1 결정사항

**`Note.tags: string[]` 인라인 저장.** 별도 `tags` 리소스 만들지 않음.

```ts
// src/types/note.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // 신규 — 빈 배열 허용, 필수 필드
  createdAt: string;
  updatedAt: string;
}
```

**근거**: 현재 스펙에 태그 자체의 메타데이터(색상, 사용 횟수, rename 등) 요구가 없다. 단일 리소스 패턴과 `Omit<Note, ...>`·`Partial<Note>` API 패턴이 그대로 유지된다. 향후 1급 시민이 필요해지면 별도 리소스로 마이그레이션한다.

### db.json 시드 마이그레이션

기존 노트 도큐먼트에 `tags: []` 를 **수동으로 backfill** 한다. 모든 도큐먼트가 `tags` 필드를 가지도록 만들어 옵셔널 처리 코드를 코드베이스에 흩뿌리지 않는다.

### API 레이어 영향 (`src/api/notes.ts`)

- `createNote` 의 입력 타입 `Omit<Note, 'id' | 'createdAt' | 'updatedAt'>` 가 자동으로 `tags: string[]` 를 요구하게 된다 → 호출 측이 항상 `tags` 를 명시적으로 전달.
- `updateNote` 의 `Partial<Note>` 는 그대로 두면 됨 — `{ tags }` 만 부분 업데이트하는 호출도 가능.
- 새 함수 추가 없음.

## UI 패턴 — Q2 결정사항

**Chip 입력기 + Enter 확정 + `×` hover 노출.**

### 컴포넌트 구조

`src/components/TagInput.tsx` 를 신설한다. (파일 1개 = 컴포넌트 1개, named export, props 인터페이스 컴포넌트 바로 위 선언.)

```ts
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}
```

- 부모(`NoteEditor`)가 `tags` state 를 보유하고 controlled 로 내려준다.
- `TagInput` 내부에는 **현재 입력 중인 텍스트만** 로컬 state 로 보관한다(`inputValue`).

### 인터랙션

| 동작                           | 결과                                                                        |
| ------------------------------ | --------------------------------------------------------------------------- |
| input 에 글자 입력             | 로컬 `inputValue` 만 갱신, `value`(배열)는 변하지 않음                      |
| `Enter` 키                     | 트림 후 추가 (중복/빈 값이면 silent 무시), `inputValue` 초기화              |
| 칩 hover                       | 해당 칩 위에 `×` 버튼이 페이드 인 (`group-hover` 패턴)                      |
| `×` 버튼 클릭                  | 해당 칩 제거 → `onChange` 호출                                              |
| 그 외 키 (콤마/탭/스페이스 등) | **추가 트리거로 쓰지 않음**. 일반 입력으로 처리 (다단어 태그 허용)          |
| 빈 input 에서 Backspace        | **별도 동작 없음** (브라우저 기본 동작, 마지막 칩 자동 삭제 같은 마법 없음) |

### 배치

`NoteEditor` 내부에서 **제목 input 과 본문 textarea 사이**. 제목 → 메타(태그) → 본문 의 시각 위계.

### 스타일 (Tailwind v4 의미 토큰만 사용)

- 컨테이너: `flex flex-wrap items-center gap-2`
- 칩: `group relative inline-flex items-center gap-1.5 bg-card border border-border text-foreground rounded-full px-3 py-1 text-xs`
- `×` 버튼: `opacity-0 group-hover:opacity-100 transition-opacity` — 칩 hover 시에만 노출
- input: 칩들과 같은 라인에 인라인으로 배치, `bg-transparent outline-none text-sm placeholder:text-muted-foreground` (placeholder: `태그 추가...`)
- 원시 색(`bg-gray-500` 등) 사용 금지 — 기존 CLAUDE.md 룰 준수.

## 서버 반영 시점 — Q3 결정사항

**`저장` 버튼 클릭 시 일괄 반영.** 즉시 PATCH 호출 없음.

- `tags` 는 `NoteEditor` 의 로컬 state.
- 제목/본문과 함께 `createNote` 또는 `updateNote` 한 호출로 묶어 전송.
- `selectedNoteId` / `isCreating` 변경 시의 폼 동기화 `useEffect` 에서 `setTags(selectedNote?.tags ?? [])` 로 리셋한다. 기존 effect 의 `eslint-disable` 컨벤션은 그대로 유지(`selectedNote` 를 deps 에서 제외) — 이는 CLAUDE.md “남아있는 일관성 결함” 에 명시된 알려진 위험으로, **이 스펙에서는 해소하지 않는다**.

### 변경 시그니처

```ts
// 새 노트 생성
createNote({ title, content, tags });

// 기존 노트 업데이트
updateNote(id, { title, content, tags });
```

## 중복 판정 — Q4 결정사항

**대소문자 무시 + 양끝 trim, 저장은 입력 그대로(케이스 보존).**

- 비교: `existing.some(t => t.toLowerCase() === input.trim().toLowerCase())`
- 추가 시 저장 값: `input.trim()` (앞뒤 공백만 제거, 케이스/중간 공백 보존)
- 중복이면 input 만 비우고 silent 무시
- 빈 문자열(`""`) 이나 공백만(`"   "`) 도 silent 무시

## 엣지 케이스 처리 (임의 확정)

| 케이스                         | 처리                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| 빈 문자열 / 공백만             | trim 후 빈이면 무시 (input 만 비움)                                                       |
| 대/소문자 다른 동일 태그       | silent 무시 (Q4)                                                                          |
| 양끝 공백 포함 입력            | trim 후 저장                                                                              |
| 중간 공백 포함 (`"front end"`) | 그대로 허용 (다단어 태그 OK)                                                              |
| 태그 길이 제한                 | **하드 제한 없음** — 칩 UI 가 시각적으로 자연 제한. MVP 단순화 위해 미설정                |
| 노트당 태그 개수 제한          | **하드 제한 없음** — 같은 이유                                                            |
| 특수문자 / 이모지              | 별도 sanitize 없이 그대로 허용                                                            |
| 기존 노트(`tags` 필드 없음)    | db.json 시드에 `tags: []` backfill (마이그레이션 단계에서 처리)                           |
| 코드 안에서의 방어             | 렌더링 지점에서 `note.tags ?? []` 디펜시브 처리 (이론상 불필요하지만 외부 시드 깨짐 대비) |

## 명시적 비범위 (Out of scope)

이번 스펙에서는 다루지 않는다:

- **태그 기반 필터/검색** — 기존 `SearchBar` 는 제목 검색 전용으로 유지. 별도 스펙으로 다룬다.
- **`NoteList` 사이드바 아이템에서의 태그 미리보기** — 시각 노이즈 우려 + 스펙 명시 없음.
- **태그 자동완성** — 별도 리소스 미사용으로 기존 태그 인덱싱이 즉시 가능하지 않음. 별도 스펙.
- **태그 색상 / 메타데이터** — 데이터 구조가 string[] 이라 불가. (B) 마이그레이션 후 별도 스펙.
- **태그 rename / merge** — 동상.
- **사용자 알림용 토스트/모달** — CLAUDE.md `alert()` 금지 룰 그대로. 실패는 `console.error` 만.

## 에러 처리

- mutation 실패 시: `NoteEditor.handleSave` 의 try/catch 에서 `console.error` 만. 토스트/모달 없음.
- 인라인 에러 UI 신규 추가 없음.

## 컨벤션 준수 체크리스트

구현 시 다음을 만족해야 한다 (CLAUDE.md 참조):

- [x] `TagInput` 은 named export + 함수 선언식
- [x] props 인터페이스(`TagInputProps`) 컴포넌트 바로 위
- [x] 콜백 prop 은 `onChange`(on + 동사), 내부 핸들러는 `handleXxx`
- [x] 부모(NoteEditor)가 state 보유, `TagInput` 은 controlled
- [x] API 호출은 기존 `api/notes.ts` 만 통과 — 신규 함수 추가 없음
- [x] mutation 동사는 `create`/`update`/`delete` 유지
- [x] 의미 기반 색상 토큰만 사용 (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`)
- [x] `rounded-full` 은 칩에만, 나머지 `rounded-xl`/`2xl`/`3xl` 유지

## 변경 파일 예상

| 파일                            | 변경 유형                                                      |
| ------------------------------- | -------------------------------------------------------------- |
| `src/types/note.ts`             | 수정 (`tags: string[]` 추가, 상단 “tags 필드 없음” 주석 제거)  |
| `src/api/notes.ts`              | 변경 없음 (타입만 자동 갱신)                                   |
| `src/context/NotesContext.tsx`  | 변경 없음 (`Partial<Note>` 시그니처가 흡수)                    |
| `src/components/NoteEditor.tsx` | 수정 (tags state + sync effect + TagInput 배치 + 저장 시 포함) |
| `src/components/TagInput.tsx`   | 신규                                                           |
| `db.json`                       | 수정 (기존 노트에 `tags: []` backfill)                         |
