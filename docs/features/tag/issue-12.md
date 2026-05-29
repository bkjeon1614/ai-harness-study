# Issue #12 — 버그: 노트 저장 후 다시 불러오면 태그가 노출되지 않음 (빈 배열로 전달 추정)

> 본 문서는 `/test-scenarios` 스킬로 작성된 시그니처 + 테스트 시나리오.
> TDD 구현(테스트 먼저 → 실패 확인 → 최소 구현)의 입력으로 사용한다.
>
> ℹ️ 본 이슈는 #10의 중복 버그. **저장 라운드트립에서 태그가 누락되는 결함**을 다룬다.
> 스코프: 기존(시드/선택된) 노트의 태그가 저장 페이로드에 실려 보존되는 것까지.
> **태그 입력 UI 추가(TAG-2)는 스코프 밖** — 현재 에디터에 입력 UI 없음.

## 시그니처

### 순수 함수

N/A — 이 수정은 `NoteEditor` 내부 폼 state 배선만. 정규화/판정 로직 없음(`normalizeForCompare` / `sanitizeForStore` / `isDuplicate`는 TAG-2 입력 스코프).

### 커스텀훅

N/A — `useTagInput`(입력/추가/제거)은 TAG-2 스코프. 본 수정은 기존 `tags`를 폼 state로 동기화하고 저장 페이로드에 포함하는 데까지.

### 컴포넌트 Props

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

- `tags` 폼 state 도입 — `const [tags, setTags] = useState<string[]>([])`.
- 폼 동기화 `useEffect`에 tags 동기화 추가 — `selectedNote`면 `setTags(selectedNote.tags ?? [])`, 생성 모드면 `setTags([])`.
- `handleSave` — `createNote({ title, content, tags })`, `updateNote(selectedNoteId, { title, content, tags })` (현재 update는 tags 누락 → 버그).
- `<TagList tags={tags} />` — `selectedNote?.tags` 직접 참조 대신 폼 state에서 렌더(표시·저장이 단일 source of truth 공유).

### 에러 케이스

| 단위                    | 조건                            | 처리                                                                 |
| ----------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `NoteEditor.handleSave` | `title.trim()`이 빈 문자열      | mutation 미호출, `console.error('제목을 입력해주세요')`. throw 없음. |
| `NoteEditor.handleSave` | `createNote`/`updateNote` 실패  | catch에서 `console.error('저장에 실패했습니다', e)`. alert 없음.     |
| 폼 동기화 `useEffect`   | `selectedNote.tags`가 undefined | `?? []`로 방어 후 `setTags([])`. throw 없음.                         |

## 테스트 시나리오

### NoteEditor — handleSave 저장 페이로드 (`src/components/NoteEditor.test.tsx`)

- [정상] NoteEditor.handleSave — should call updateNote with tags equal to the selected note's existing tags when saving an edited note whose tags are non-empty
- [경계] NoteEditor.handleSave — should call updateNote with tags as an empty array when saving an edited note whose existing tags are an empty array
- [경계] NoteEditor.handleSave — should call createNote with tags as an empty array when saving a new note in creating mode (no tag input UI in this issue's scope)
- [예외] NoteEditor.handleSave — should not call createNote or updateNote when title trims to empty (guard preserved across the tags fix)

### NoteEditor — tags 폼 state 동기화 (`src/components/NoteEditor.test.tsx`)

- [정상] NoteEditor form sync — should initialize tags form state from selectedNote.tags so that saving an unchanged note preserves them when a note with non-empty tags is selected
- [정상] NoteEditor form sync — should resync tags form state when selectedNoteId switches to a different note (saving the new note sends the new note's tags)
- [경계] NoteEditor form sync — should initialize tags form state to an empty array in creating mode

### NoteEditor — 태그 표시 (폼 state 기반) (`src/components/NoteEditor.test.tsx`)

- [정상] NoteEditor display — should render existing tags as chips between title input and content textarea when selected note has non-empty tags
- [경계] NoteEditor display — should render the tag area without any chip when selected note has empty tags
- [정상] NoteEditor display — should update displayed chips immediately when selectedNoteId switches to a note with different tags

### AC 커버리지 매핑

> 이슈 #12는 형식 AC(`AC-N.N`)가 없는 버그 리포트. 아래 AC는 "기대 동작"(저장 시 입력했던 태그가 유지되어 다시 불러왔을 때 노출)에서 도출한 수용 기준.

| AC                                                                                    | 커버 시나리오                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 — 기존 태그 있는 노트 편집·저장 시 `updateNote` 페이로드에 태그 포함 (누락 금지) | [정상] NoteEditor.handleSave — should call updateNote with tags equal to the selected note's existing tags when saving an edited note whose tags are non-empty                                                |
| AC-2 — 빈 태그도 정확히 전달 (`tags: []`)                                             | [경계] NoteEditor.handleSave — should call updateNote with tags as an empty array ... ; [경계] NoteEditor.handleSave — should call createNote with tags as an empty array ...                                 |
| AC-3 — 저장 후 다시 불러올 때 태그 노출 (폼 state 동기화·표시)                        | [정상] form sync — initialize tags from selectedNote.tags ; [정상] form sync — resync when selectedNoteId switches ; [정상] display — render existing tags as chips ; [정상] display — update chips on switch |
| AC-4 — 신규 노트 생성 시 태그가 페이로드에 포함 (현재 입력 UI 없어 `[]`)              | [경계] NoteEditor.handleSave — should call createNote with tags as an empty array when saving a new note in creating mode ; [경계] form sync — initialize tags to [] in creating mode                         |
| AC-5 — 제목 빈 값 저장 가드 유지 (회귀 없음)                                          | [예외] NoteEditor.handleSave — should not call createNote or updateNote when title trims to empty                                                                                                             |
