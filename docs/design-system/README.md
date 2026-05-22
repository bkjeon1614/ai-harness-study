# The Digital Atelier — Note App Design System

> 노트 앱의 디자인 시스템. 이 폴더의 문서는 앞으로의 **모든 스타일 작업에서 단일 참조점**이다. 스타일 PR을 올리기 전, 이 README와 관련 문서를 먼저 확인한다.

## 문서 구성

| 문서                                 | 담는 것                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| [`README.md`](./README.md) (이 문서) | 컨셉(Creative North Star), 핵심 원칙 4가지, 전역 Do/Don't 요약, 현재 코드와의 갭                                                |
| [`CLAUDE.md`](./CLAUDE.md)           | Claude/사람이 이 폴더 작업 시 진입 가이드 — 작업 트리거별 읽을 파일 매핑                                                        |
| [`tokens.md`](./tokens.md)           | Color/Surface, Typography, Spacing, Elevation — 모든 raw 값과 토큰 매핑                                                         |
| [`components/`](./components/)       | Button · Card · List · Input · Knowledge Token — **1파일 = 1컴포넌트**. 진입은 [`components/README.md`](./components/README.md) |

---

## 1. Creative North Star — The Curated Archive

이 시스템은 흔한 "knowledge base 템플릿"의 외형을 거부한다. 대신 **고급 디지털 아틀리에**의 철학을 채택한다. Notion의 유틸리티에서 영감을 얻되, 실행은 **Soft Minimalism**의 영역으로 옮긴다. 모든 TIL(Today I Learned) 항목은 단순한 데이터가 아니라, 개인 박물관에 진열된 귀한 표본이다.

이 시스템은 두 가지 장치로 "generic SaaS" 룩을 깨뜨린다:

- **Intentional Asymmetry (의도된 비대칭)** — 칸막이된 격자 대신 호흡하는 여백.
- **Tonal Depth (톤의 깊이)** — 콘텐츠를 보더로 가두지 않고, 정교한 중성 톤의 레이어 위에 띄운다. 타이포그래피가 숨 쉬고, 정보가 무대 중심에 선다.

배움의 **고요한 순간**을 우선한다. UI는 절대 통찰과 경쟁하지 않는다.

---

## 2. 핵심 원칙 4가지

### 2.1 The "No-Line" Rule

**1px solid border는 구역 분리 용도로 금지한다.** 경계는 **배경 톤 차이**로만 정의한다.

- 사이드바(`surface_container_low` `#f1f4f6`)는 본문(`surface` `#f8f9fa`) 옆에 그냥 놓인다 — 전환은 _보이지 않고 느껴진다_.
- 리스트 항목 사이에는 `divide-y` 대신 `gap-4`(spacing.4 = 1.4rem).

상세: [`tokens.md` §1.7](./tokens.md#17-the-no-line-rule)

### 2.2 Surface Hierarchy & Nesting

UI를 **물리적으로 쌓인 종이**처럼 다룬다. surface 토큰을 중첩해 깊이를 만든다:

- **Base** (`surface` `#f8f9fa`) — 기본 캔버스
- **Secondary** (`surface_container_low` `#f1f4f6`) — 사이드바, 보조 영역
- **Interactive** (`surface_container_lowest` `#ffffff`) — 최우선 카드, 활성 작업 영역

상세: [`tokens.md` §1.6](./tokens.md#16-surface-hierarchy--어디에-무엇을)

### 2.3 The "Glass & Gradient" Rule

플로팅 요소(모달, 드롭다운)는 **Glassmorphism**: `surface` 80% + `backdrop-filter: blur(12px)`.

Primary CTA는 **그라데이션**: `tertiary` (`#0053dc`) → `tertiary_container` (`#3e76fe`). 평평한 단색 액센트는 "engineered" 느낌을 주므로, 그라데이션으로 "보석 같은" 깊이를 만든다.

상세: [`tokens.md` §1.8](./tokens.md#18-the-glass--gradient-rule)

### 2.4 Editorial Typography

폰트는 사양상 **Inter 전용**(현재 코드는 Pretendard — §4 갭 참조). 위계는 **scale·weight·letter-spacing**으로만 만든다.

- `display-lg` (3.5rem, -0.02em) — 랜딩 모먼트
- `headline-md` (1.75rem, line-height 1.4) — TIL 제목
- `body-lg` (1rem) — 본문 워크호스
- `label-md` (0.75rem, uppercase, +0.05em) — 메타데이터

상세: [`tokens.md` §2](./tokens.md#2-typography-scale)

---

## 3. 전역 Do / Don't (한눈에)

### DO ✅

- **화이트스페이스를 구조 요소**로 사용한다. 의심되면 여백을 늘린다.
- 사이드바 "Selected" 상태에 `surface_container_highest` (`#dbe4e7`) — 가장 진한 surface로 시각 앵커.
- accent(`tertiary` `#0053dc`)는 **의도 있는 액션**(저장, 추가, 주요 링크)에만. 화면당 Primary 버튼은 단 하나.
- 중요 텍스트에 `on_surface` (`#2b3437`) — soft하고 고급스러운 톤 유지.
- 본문 장문에는 `on_surface_variant` (`#586064`) — 눈의 피로를 줄인다.
- 카드 lift는 **톤 차이로**: `surface_container_lowest` on `surface_container`.

### DON'T ❌

- **순수 검정** (`#000000`) 텍스트. 항상 `on_surface` 사용.
- **디폴트 그림자** (`shadow-md`, `shadow-lg`). "designed"가 아닌 "engineered"로 보인다.
- **기능적 명확성이 없는 아이콘 남용**. 이 시스템은 타이포그래피 주도.
- **사이드바를 border로 구분**. 톤 차이만 사용 (No-Line Rule).
- **원시 색 클래스** (`bg-gray-500`, `text-blue-700`) 직접 사용. 의미 토큰 우선 — 새 색이 필요하면 `@theme`부터.
- 리스트 항목 사이 `divide-y` / `border-b`. spacing.4 갭만.

> 컴포넌트별 Do/Don't는 [`components/`](./components/) 각 파일에, 카테고리별(Color/Typography/Spacing/Elevation) Do/Don't는 [`tokens.md`](./tokens.md) 각 섹션 끝에 정리되어 있다.

---

## 4. ⚠️ 현재 코드와의 갭 (요약)

이번 문서화 작업은 **사양 정리만** 한다. `src/index.css`는 손대지 않는다. 아래 항목은 추후 토큰 동기화 작업의 체크리스트.

### 폰트

- 사양: **Inter** 단일 폰트.
- 현재: **Pretendard**(본문) + **Boogaloo**(디스플레이).
- **결정**: 한글 가독성 우선으로 Pretendard 유지. 이 문서의 scale·letter-spacing·line-height 규칙은 그대로 Pretendard에 적용한다.

### 토큰

`src/index.css` `@theme`에 다음이 **미정의** 또는 **다른 값**:

- ⚠️ Surface 5단계 (`surface_container_low/_high/_highest/_lowest`, `surface_container`) — 전부 미정의
- ⚠️ Accent 계열 (`tertiary`, `tertiary_container`, `on_tertiary`) — 전부 미정의
- ⚠️ `outline_variant`, `on_surface_variant` — 미정의
- ⚠️ Spacing scale의 1.4rem 운율 — Tailwind 기본 0.25rem 단위로는 정확 표현 불가, `gap-[1.4rem]` 같은 인라인으로 잠정
- ⚠️ Radius scale (`md` 0.375rem 등) — 현재는 `--radius: 0.75rem` 단일

토큰별 상세 상태는 [`tokens.md`](./tokens.md) 각 표의 "상태" 칼럼 참조.

### 작업 시 가이드

1. 토큰이 정의되어 있으면 (`bg-card`, `text-foreground`, `text-muted-foreground` 등) **항상 의미 토큰을 사용**.
2. 미정의 토큰을 써야 할 땐 **인라인 hex** (`bg-[#f1f4f6]`)로 잠정 표현하되, PR 설명에 "⚠️ 토큰화 필요" 메모.
3. 같은 미정의 토큰이 3곳 이상에서 쓰이면 **`@theme`에 토큰부터 추가**하는 별도 작업을 제안.

---

## 5. 변경 이력 / 확장

이 시스템을 확장하거나 토큰을 동기화할 때는:

- 새 컴포넌트 사양 → [`components/<kebab-case>.md`](./components/) 신규 파일 + [`components/README.md`](./components/README.md) "컴포넌트 목록" 표에 1행 추가. 템플릿은 `components/README.md` 참조.
- 새 토큰 → [`tokens.md`](./tokens.md)에 표 항목으로 추가, 동시에 `src/index.css` `@theme` 업데이트.
- 핵심 원칙 자체가 바뀌면 이 README의 §2를 갱신.
