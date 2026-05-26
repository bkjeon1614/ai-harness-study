# Issue #2 — TAG-1 — 노트 상세 화면에서 노트의 태그를 본다

> 본 문서는 `/test-scenarios` 스킬로 작성된 시그니처 + 테스트 시나리오.
> TDD 구현(테스트 먼저 → 실패 확인 → 최소 구현)의 입력으로 사용한다.
>
> ℹ️ 본 이슈는 tag 트랙의 첫 슬라이스(표시 전용). 입력(TAG-2 / #3)·삭제(TAG-3 / #4) UI는 명시적 스코프 밖이며, 다음 슬라이스의 데이터·UI 토대를 제공한다.

## 시그니처

### 순수 함수

N/A — 이 슬라이스는 표시 전용이라 정규화/판정 로직 없음. ADR-004 (`normalizeForCompare` / `sanitizeForStore` / `isDuplicate`) 는 TAG-2 (입력) 에서 도입.

### 커스텀훅

N/A — `useTagInput` (ADR-002) 은 입력/추가/제거 책임이므로 TAG-2 부터. 표시 흐름은 `NoteEditor` → `selectedNote.tags` → `TagList` props 전달만으로 충분.

### 컴포넌트 Props

```ts
// src/types/note.ts — 수정
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // 신규 — 필수, 빈 배열 허용. 상단 "tags 필드 없음" 주석 제거
  createdAt: string;
  updatedAt: string;
}
```

```ts
// src/components/TagChip.tsx — 신규
interface TagChipProps {
  label: string;
}
export function TagChip(props: TagChipProps): JSX.Element;
```

```ts
// src/components/TagList.tsx — 신규
interface TagListProps {
  tags: string[];
}
export function TagList(props: TagListProps): JSX.Element;
```

```ts
// src/components/NoteEditor.tsx — Props 변경 없음 (내부 변경만)
interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}
export function NoteEditor(props: NoteEditorProps): JSX.Element;
```

#### NoteEditor 내부 변경 요약 (시그니처 변경 아님, 본문 변경)

- 제목 input 과 본문 textarea **사이** 에 `<TagList tags={selectedNote?.tags ?? []} />` 배치 (AC-1.3 시각 위계).
- 새 노트 모드(`isCreating === true`): `tags` state 미도입(스코프 밖). 단, `createNote({ title, content })` → `createNote({ title, content, tags: [] })` 1줄 수정으로 `Note` 필수 필드 만족.
- 폼 동기화 `useEffect` 변경 없음 — `tags` state 자체가 없고 표시는 `selectedNote.tags` props 직접 전달.

### 에러 케이스

| 단위           | 조건                         | 처리                                                                                                                     |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `TagList`      | `tags === []`                | 빈 컨테이너만 렌더. placeholder/안내 문구 없음. throw 없음.                                                              |
| `TagList`      | `tags.length >= 1`           | 입력 순서대로 chip 렌더. throw 없음.                                                                                     |
| `TagChip`      | `label` 정상 문자열          | chip 1개 렌더. throw 없음.                                                                                               |
| `TagChip`      | `label` 빈 문자열            | 빈 칩 1개 렌더(디펜시브 처리 없음). 시드 정책상 빈 문자열 태그 미존재 전제. throw 없음.                                  |
| `Note.tags`    | `undefined` (외부 시드 깨짐) | `NoteEditor` 가 `selectedNote?.tags ?? []` 로 디펜시브 처리한 뒤 `TagList` 에 전달 (spec-fixed.md "코드 안에서의 방어"). |
| `db.json` 시드 | 일부 노트 `tags` 누락        | AC-1.1 위반 → 백필 마이그레이션으로 `tags: []` 추가 해결. 코드 throw 없음.                                               |

### 데이터 변경 (시그니처 외)

- `db.json` 시드: 기존 노트 전체에 `tags: []` 백필 + 시연용 1~2개에 데모 태그(예: `["react", "demo"]`).
- `createNote` 입력 타입 `Omit<Note, 'id' | 'createdAt' | 'updatedAt'>` 가 `tags: string[]` 를 자동으로 필수 요구 → `NoteEditor.handleSave` 호출처 1줄 수정.

## 테스트 시나리오

### TagChip (`src/components/TagChip.test.tsx`)

- [x] [정상] TagChip — should render the label text inside the chip when label is a normal non-empty string
- [x] [정상] TagChip — should render multi-word label preserving internal whitespace when label contains a space

### TagList (`src/components/TagList.test.tsx`)

- [x] [정상] TagList — should render one chip per tag in the given order when tags has multiple entries
- [x] [정상] TagList — should render a single chip when tags has exactly one entry
- [x] [경계] TagList — should render the container but no chips when tags is an empty array
- [x] [경계] TagList — should not render any placeholder or guide text when tags is empty

### NoteEditor — TAG-1 동작 (`src/components/NoteEditor.test.tsx`)

- [x] [정상] NoteEditor — should render existing tags as chips between title input and content textarea when selected note has non-empty tags
- [x] [경계] NoteEditor — should render the tag area without any chip when selected note has empty tags
- [x] [정상] NoteEditor — should update displayed chips immediately when selectedNoteId switches to a note with different tags
- [x] [경계] NoteEditor — should render the tag area without any chip in creating mode (no selectedNote)
- [x] [정상] NoteEditor — should call createNote with tags as an empty array when saving a new note in creating mode

### db.json seed — 데이터 형태 검증 (`src/lib/seed.test.ts`)

- [x] [경계] db.json seed — should include a tags array on every note entry in the seed data

### AC 커버리지 매핑

| AC                                | 커버 시나리오                                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1.1 — 모든 노트 `tags` 필드    | [경계] db.json seed — should include a tags array on every note entry in the seed data                                                                                                                                                                                          |
| AC-1.2 — `Note` 타입 `tags` 필수  | TS strict 컴파일 시점 강제(`npx tsc --noEmit`). 런타임 증인: [정상] NoteEditor — should call createNote with tags as an empty array when saving a new note in creating mode (`tags` 누락 시 컴파일 에러)                                                                        |
| AC-1.3 — 제목/본문 사이 chip 표시 | [정상] NoteEditor — should render existing tags as chips between title input and content textarea when selected note has non-empty tags                                                                                                                                         |
| AC-1.4 — 빈 tags 노트는 빈 영역   | [경계] NoteEditor — should render the tag area without any chip when selected note has empty tags · [경계] TagList — should render the container but no chips when tags is an empty array · [경계] TagList — should not render any placeholder or guide text when tags is empty |
| AC-1.5 — 노트 전환 시 동기화      | [정상] NoteEditor — should update displayed chips immediately when selectedNoteId switches to a note with different tags                                                                                                                                                        |
