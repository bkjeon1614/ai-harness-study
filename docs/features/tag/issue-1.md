# Issue #1 — SEARCH-CONTENT-1 — 사이드바 검색이 본문 키워드도 잡는다

> 본 문서는 `/test-scenarios` 스킬로 작성된 시그니처 + 테스트 시나리오.
> TDD 구현(테스트 먼저 → 실패 확인 → 최소 구현)의 입력으로 사용한다.
>
> ℹ️ 본 이슈는 search-content 트랙이지만, 스킬 Hard Rule 5에 따라 출력 경로는 `docs/features/tag/`로 고정되어 여기에 기록됨.

## 시그니처

### 순수 함수

```ts
// src/lib/search.ts (신규)
import type { Note } from '../types/note';

export function matchesQuery(note: Pick<Note, 'title' | 'content'>, query: string): boolean;
```

### 커스텀훅

N/A — 이 기능은 신규 훅을 도입하지 않음. 검색 state(`searchQuery`)는 기존 `App.tsx`의 `useState`에 그대로 유지. 매칭 로직은 순수 함수로 완결.

### 컴포넌트 Props

```ts
// src/components/SearchBar.tsx — Props 변경 없음 (placeholder 문자열만 수정)
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

// src/components/NoteList.tsx — Props 변경 없음 (내부 필터 술어만 matchesQuery로 교체)
interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  searchQuery?: string;
}
```

### 에러 케이스

| 함수 / 단위    | 조건                                                  | 처리                                                        |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `matchesQuery` | `query`가 `""` 또는 trim 후 `""`                      | `true` 반환 (필터 미적용 의미). throw 없음.                 |
| `matchesQuery` | 정상 입력 (string title/content, 비어있지 않은 query) | 대소문자 무시 substring 매칭 결과 boolean 반환. throw 없음. |
| `matchesQuery` | 어떠한 입력                                           | throw 일체 없음 (순수 함수, 부수 효과 없음).                |

## 테스트 시나리오

### 순수 함수 — matchesQuery

- [x] [정상] matchesQuery — should return true when query is a substring of `title` (case-sensitive same)
- [x] [정상] matchesQuery — should return true when query is a substring of `content` (case-sensitive same)
- [x] [정상] matchesQuery — should return true when query case differs from title or content (case-insensitive match)
- [x] [정상] matchesQuery — should return false when query is neither in title nor in content
- [x] [정상] matchesQuery — should return true exactly once (boolean OR, not double-counted) when query matches in both title and content
- [x] [경계] matchesQuery — should return true when query is empty string (no filter applied)
- [x] [경계] matchesQuery — should return true when query is whitespace-only (trim → empty → no filter applied)
- [x] [경계] matchesQuery — should match correctly when query has leading/trailing whitespace (trim applied before match)
- [x] [경계] matchesQuery — should match multi-word query as a single substring (no token splitting; "front end" matches "front end" but not split)
- [x] [경계] matchesQuery — should match substring within longer word (e.g., "react" matches "reactor") — intentional per ADR-002
- [x] [예외] matchesQuery — should not throw for any combination of valid string inputs (totality of pure function)
- [x] [예외] matchesQuery — should treat regex special characters in query as literal substring (no regex behavior)

### UI 통합 — SearchBar + NoteList

- [x] [정상] SearchBar — should render with new unified placeholder text (e.g., "키워드로 검색...") when value is empty
- [x] [정상] NoteList — should display the notes whose content matches `searchQuery` (new behavior)
- [x] [정상] NoteList — should display notes matching `"useEffect"` when `searchQuery` is `"  useEffect  "` (leading/trailing whitespace trimmed before title/content matching)

> 메모(2026-05-24 옵션 3 반영): 기존 NoteList 시나리오 5개(제목 매칭 회귀, 빈 쿼리 전체 표시, "검색 결과가 없습니다" 메시지, 중복 비노출, 즉시 갱신)는 현재 `src/components/NoteList.tsx`가 이미 만족하는 동작이므로 RED 시나리오로 부적합 — `/tdd-red` 실행 중 사전 통과로 검출되어 제외됨. 해당 회귀 동작은 `matchesQuery` 단위 테스트로 등가 보장되며, GREEN 단계에서 NoteList의 필터 술어를 `matchesQuery`로 swap하는 변경이 위 신규 시나리오로 검증된다.

### AC 커버리지 매핑

| AC                                 | 커버 시나리오                                                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1.1 — 제목 매칭 회귀 보장       | [정상] matchesQuery — substring of title (case-sensitive)                                                                                |
| AC-1.2 — 본문에만 있는 키워드 매칭 | [정상] matchesQuery — substring of content; [정상] NoteList — filtered by content match                                                  |
| AC-1.3 — 중복 노출 없음            | [정상] matchesQuery — returns true exactly once when both match                                                                          |
| AC-1.4 — 빈 상태 메시지            | [정상] matchesQuery — false when no match                                                                                                |
| AC-1.5 — 빈 검색어 전체 표시       | [경계] matchesQuery — empty/whitespace returns true                                                                                      |
| AC-1.6 — 대소문자 무시 매칭        | [정상] matchesQuery — case-insensitive match                                                                                             |
| AC-1.7 — 입력 즉시 결과 갱신       | (테스트 미할당 — `src/`에 debounce 코드 부재로 정적 보장; 코드 리뷰로 확인)                                                              |
| AC-1.8 — 양끝 공백 trim            | [경계] matchesQuery — leading/trailing whitespace trimmed before match; [정상] NoteList — trimmed search equivalence (`"  useEffect  "`) |
| AC-1.9 — placeholder 문구 변경     | [정상] SearchBar — render with new unified placeholder                                                                                   |
