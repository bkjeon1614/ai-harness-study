---
name: mermaid-diagram
description: 프로젝트 코드베이스(특히 `src/`)를 분석하여 Mermaid 다이어그램이 포함된 단일 HTML 파일을 생성하고, 브라우저에서 바로 열어 시각화한다. 사용자가 "프로젝트 구조/아키텍처를 그려줘", "컴포넌트 의존성을 시각화", "상태 흐름도", "Mermaid로 그려줘", "src 분석해서 다이어그램" 같은 요청을 할 때 사용한다. 출력 경로 기본값은 `docs/architecture/index.html` 이며 macOS 에서는 `open` 명령으로 브라우저를 자동 실행한다.
---

# Mermaid Diagram

프로젝트의 `src/` 디렉토리를 정적 분석하여 3종류의 Mermaid 다이어그램을 한 페이지에 담은 HTML 파일을 생성하고 브라우저에서 즉시 확인한다.

## Workflow

다음 순서로 진행한다. 각 단계의 결과를 다음 단계로 그대로 넘긴다.

### 1. 분석 대상 수집

- `src/` 하위 모든 `.ts`/`.tsx`/`.js`/`.jsx` 파일을 Glob 으로 수집한다.
- 각 파일을 **병렬 Read** 한다. 토큰을 아끼기 위해 한 번씩만 읽는다.
- 각 파일에서 다음을 추출한다:
  - **import 문** — `import ... from '경로'` 의 from 경로. 상대 경로(`./`, `../`)만 의존성 엣지로 본다. 외부 패키지(`react`, `node:`, 절대 패키지명)는 제외.
  - **default export / named export** — 노드 라벨에 표시할 심볼 이름.
  - **Context Provider/Consumer 단서** — `createContext`, `useContext`, `*Provider`, `use*` 훅. 상태 흐름 그래프에 사용.
  - **fetch / axios / API 함수 정의** — `api/` 레이어 식별.

### 2. 그래프 데이터 모델 구성

메모리상에서 다음 구조를 만든다(실제 파일로 저장할 필요는 없다):

```
nodes: [{ id, label, layer }]
edges: [{ from, to }]
```

- `id` 는 Mermaid 가 안전하게 다루도록 sanitize 한다. `src/components/NoteList.tsx` → `src_components_NoteList`.
- `label` 은 사람이 읽는 이름(`NoteList.tsx`).
- `layer` 는 디렉토리 첫 세그먼트(`components`, `context`, `api`, `types`, `hooks`, 기타는 `root`).
- 자기 자신으로의 엣지·중복 엣지는 제거한다.

### 3. 3종류의 Mermaid 다이어그램 생성

가장 중요한 산출물이다. 아래 세 다이어그램의 **Mermaid 소스 문자열**을 만든다.

#### 3.1 컴포넌트 의존성 그래프 (`graph TD`)

- `subgraph` 로 레이어별 묶기 (`components`, `context`, `api`, `types`, `root`).
- 엣지 방향: **import 하는 쪽 → import 되는 쪽**. (예: `App.tsx` 가 `NoteList.tsx` 를 import 하면 `App --> NoteList`)
- `classDef` 로 레이어별 색상 지정:
  - components: 파랑 (`fill:#dbeafe,stroke:#3b82f6`)
  - context: 초록 (`fill:#dcfce7,stroke:#22c55e`)
  - api: 주황 (`fill:#ffedd5,stroke:#f97316`)
  - types: 회색 (`fill:#e5e7eb,stroke:#6b7280`)
  - root: 보라 (`fill:#ede9fe,stroke:#8b5cf6`)
- 노드 라벨에 `.tsx`/`.ts` 확장자 포함하여 한눈에 종류를 알 수 있게 한다.

#### 3.2 상태/데이터 흐름도 (`flowchart LR`)

코드 분석 결과를 바탕으로 단방향 데이터 흐름을 도식화한다. 일반적인 React + Context + REST 구조면 아래 패턴이 잘 맞는다 — 프로젝트의 실제 식별자로 치환해서 그린다.

```
User Action
  → [Component (handle*)]
  → [useXxx() hook]
  → [Context mutation (create/update/delete)]
  → [api/*.ts function]
  → fetch
  → [json-server / Backend]
  → Response
  → [setState in Context]
  → [Component re-render]
```

- 양방향 흐름은 두 개의 단방향 화살표로 표현한다.
- 실제 코드에 존재하는 함수명을 노드 라벨에 그대로 쓴다 (예: `createNote()`, `useNotes()`).

#### 3.3 디렉토리/파일 구조 (`graph LR`, 트리 풍)

`src/` 트리를 좌→우로 펼친다. 너무 깊으면 2단계까지만.

### 4. HTML 생성

- 템플릿: `assets/template.html` 을 Read 한 뒤, 아래 플레이스홀더를 치환한다.
  - `{{PROJECT_NAME}}` — `package.json` 의 `name` 필드 또는 디렉토리명
  - `{{GENERATED_AT}}` — 현재 ISO 일시
  - `{{SUMMARY}}` — 분석 요약 chip HTML (노드 수, 엣지 수, 레이어 목록). 예: `<span class="chip">nodes: 11</span>`
  - `{{MERMAID_DEPENDENCY}}` — 3.1 의 Mermaid 소스
  - `{{MERMAID_FLOW}}` — 3.2 의 Mermaid 소스
  - `{{MERMAID_TREE}}` — 3.3 의 Mermaid 소스
- 출력 경로: 기본 `docs/architecture/index.html`. 사용자가 다른 경로를 지정하면 그것을 우선.
- 상위 디렉토리가 없으면 `mkdir -p` 로 만든다.
- 기존 파일이 있으면 덮어쓴다 (동일 산출물 갱신이므로 확인 불필요).

### 5. 브라우저 자동 실행

`uname -s` 로 플랫폼을 감지하여 분기한다:

- `Darwin` → `open "<절대경로>"`
- `Linux` → `xdg-open "<절대경로>"` (없으면 안내 메시지)
- `MINGW*`/`CYGWIN*`/Windows → `start "" "<절대경로>"`

실행이 실패해도 작업은 성공으로 간주하고, 사용자가 직접 열 수 있도록 **절대경로를 마지막에 출력**한다.

### 6. 결과 보고

다음 항목을 짧게 보고한다:

- 생성 파일 경로 (절대경로)
- 노드 수 / 엣지 수 / 레이어 목록
- 발견된 **순환 의존성**이 있다면 해당 사이클을 경고로 표시
- 외부 패키지 의존성은 제외했음을 명시

## Mermaid 작성 규칙 (실수 방지)

- **노드 ID**: 알파벳/숫자/언더스코어만. `/`, `.`, `-` 사용 금지.
- **라벨에 특수문자**: 큰따옴표로 감싼다 — `nodeId["NoteList.tsx"]`.
- **`graph TD` 와 `flowchart LR`** 은 같은 문법이지만 `flowchart` 가 신문법. 신규 작성은 `flowchart` 권장.
- **subgraph 닫기** — `end` 키워드 필수.
- **classDef 적용** — `class nodeA,nodeB layerName` 한 줄로 모아서 적용.
- 다이어그램이 너무 크면(노드 30개 초과) `flowchart TB` 로 바꾸고 폰트 크기를 줄인다.

## Constraints

- HTML 은 **단일 파일** + Mermaid CDN 1개만 사용한다. 빌드 도구·번들러 의존성 없음.
- 오프라인 환경에서는 다이어그램이 렌더되지 않음 — 사용자에게 보고 시 한 줄로 명시.
- Tailwind 등 프로젝트 스타일과 격리. HTML 의 CSS 는 인라인으로 자족적이게 작성.
- 사용자가 출력 경로를 명시하지 않으면 `docs/architecture/index.html` 사용.

## Assets

- `assets/template.html` — 치환 플레이스홀더가 박힌 단일 HTML 템플릿. Mermaid CDN, 인라인 CSS, 3개의 다이어그램 섹션이 포함되어 있다. **Read 한 뒤 문자열 치환으로만 사용**하고 직접 편집하지 않는다.

## 사용 예시

- "프로젝트 구조 mermaid 로 그려줘" → 이 스킬 실행
- "src 분석해서 컴포넌트 의존성 시각화" → 이 스킬 실행
- "아키텍처 다이어그램 만들어줘, docs/arch.html 에 저장" → 출력 경로만 바꿔서 실행
