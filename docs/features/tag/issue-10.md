# Issue #10 — fix: 저장한 태그가 노트 재조회 시 노출되지 않음

> 본 문서는 `/test-scenarios` 스킬로 작성된 시그니처 + 테스트 시나리오.
> TDD 구현(테스트 먼저 → 실패 확인 → 최소 구현)의 입력으로 사용한다.
>
> 본 이슈의 작업 범위는 **NoteEditor 내부 데이터 흐름 수정** 으로 한정한다 (TagInput UI 신설은 후속 이슈 TAG-2 의 책임). 즉 외부 인터페이스(Props, API, Context mutation) 시그니처는 **변경하지 않고**, NoteEditor 내부 폼 state 와 `handleSave` 의 API 호출 인자만 손본다.

## 시그니처

### 순수 함수

**없음.** 본 이슈는 신규 순수 함수를 만들지 않는다. (정규화·중복 판정 등은 PRD ADR-004 가 다루는 후속 이슈 TAG-2 의 범위.)

### 커스텀훅

**없음.** 본 이슈는 신규 훅을 만들지 않는다. (`useTagInput` 등은 후속 이슈 TAG-2 의 범위.)

### 컴포넌트 Props

`NoteEditor` Props 는 변경 없음을 명시한다.

```ts
// src/components/NoteEditor.tsx (기존 그대로)
interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}
export function NoteEditor(props: NoteEditorProps): JSX.Element;
```

### 에러 케이스

```
NoteEditor.handleSave — title 이 trim 후 빈 문자열이면 console.error 후 silent return.
                       createNote / updateNote 미호출. (기존 동작 유지)

NoteEditor.handleSave — selectedNoteId 가 null 이고 isCreating 도 false 인 상태에서는
                       컴포넌트가 placeholder 뷰만 렌더하므로 저장 버튼 자체가 없음.
                       handleSave 도달 불가 (이론상 dead path).

NoteEditor.handleSave — createNote / updateNote 가 reject 되면 catch 후
                       console.error('저장에 실패했습니다', e). UI 토스트/alert 없음.
                       (기존 동작 유지)

NoteEditor (선택된 노트 폼 동기화) — selectedNoteId 가 가리키는 노트가 notes 배열에 없으면
                                    (예: 외부에서 삭제 직후) selectedNote = undefined.
                                    useEffect 는 폼을 갱신하지 않고 직전 값 유지.
                                    selectedNoteId 가 살아있는 한 stale tags 가 그대로 사용되는 위험은
                                    부모(App) 가 selectedNoteId 정리를 책임 — 본 이슈 비범위.
```

## 테스트 시나리오

### 단위 1 — NoteEditor.handleSave (저장 시 API 호출 인자)

- [x] [정상] NoteEditor.handleSave — should call updateNote with `tags` equal to the selected note's existing tags when saving an edited note whose tags are non-empty
- [x] [경계] NoteEditor.handleSave — should call updateNote with `tags: []` when saving an edited note whose existing tags are an empty array
- [x] [경계] NoteEditor.handleSave — should call createNote with `tags: []` when saving a new note in creating mode (no tag input UI in this issue's scope)
- [x] [예외] NoteEditor.handleSave — should not call createNote or updateNote when title trims to empty (existing guard preserved across the tags fix)

### 단위 2 — NoteEditor 폼 tags state 동기화 (useEffect)

- [x] [정상] NoteEditor (form sync) — should initialize internal tags state from `selectedNote.tags` when a note with non-empty tags is selected
- [x] [정상] NoteEditor (form sync) — should resync internal tags state to the new note's tags when `selectedNoteId` switches between notes with different tags
- [x] [경계] NoteEditor (form sync) — should initialize internal tags state to `[]` when entering creating mode (`isCreating=true`, no selectedNote)

### AC 커버리지 매핑

본 이슈는 GitHub 이슈 본문에 `AC-N.N` 형식의 라벨이 없으므로, 본문의 §"기대 동작" 2건과 §"확인 포인트" 4건을 AC-1 ~ AC-6 로 라벨링하여 매핑한다.

| AC           | 의미                                                                               | 커버 시나리오                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 (기대1) | 저장 시 입력한 태그가 서버에 정확히 기록된다                                       | [정상] handleSave — updateNote with tags / [경계] handleSave — updateNote with tags:[] / [경계] handleSave — createNote with tags:[]                                         |
| AC-2 (기대2) | 다시 불러올 때 저장 직전과 동일한 태그 목록이 노출된다                             | [정상] form sync — initialize from selectedNote.tags / [정상] form sync — resync on selectedNoteId switch                                                                    |
| AC-3 (확인1) | `createNote` / `updateNote` 호출 페이로드에 `tags` 필드가 포함된다                 | [정상] handleSave — updateNote with tags / [경계] handleSave — updateNote with tags:[] / [경계] handleSave — createNote with tags:[]                                         |
| AC-4 (확인2) | Context mutation 호출부에서 `tags` 가 전달된다                                     | 본 이슈 fix 는 NoteEditor 가 직접 mutation 을 호출하는 구조이므로 AC-3 의 시나리오들이 자동 커버 (NotesContext 자체는 `Partial<Note>` 시그니처라 변경 불필요)                |
| AC-5 (확인3) | NoteEditor 의 폼 상태가 저장 시 `tags` 를 잃지 않는다 (useEffect 동기화 누락 없음) | [정상] form sync — initialize from selectedNote.tags / [정상] form sync — resync on switch / [경계] form sync — creating mode reset to []                                    |
| AC-6 (확인4) | `db.json` 의 실제 저장 결과가 입력한 태그와 일치한다                               | 단위 테스트 차원에서는 mocked `createNote`/`updateNote` 의 호출 인자 검증으로 대리 (AC-3 시나리오들과 동일). 실제 round-trip 검증은 후속 이슈(e2e tags.spec.ts 확장)의 책임. |

### 비범위 시나리오 (의도적 제외)

- 사용자가 태그를 **추가**하는 UI 인터랙션 — TagInput 컴포넌트 부재. 후속 이슈 TAG-2 (`/tdd-red` 입력의 spec-fixed.md 참조).
- 사용자가 태그를 **삭제**하는 인터랙션 — 후속 이슈 TAG-3.
- 태그 정규화 (trim, lowercase, dedup) — 후속 이슈 TAG-2 의 순수 함수 단위.
- end-to-end round-trip 검증 — e2e/tests/tags.spec.ts 확장 별도 작업.
