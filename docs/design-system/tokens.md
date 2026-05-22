# Design Tokens — The Digital Atelier

> 이 문서는 색·타입·공간·elevation의 **모든 raw 값**을 모은 단일 레퍼런스다. 스타일 작업 시 토큰명/값은 항상 이 문서에서 검색해 옮긴다.
> 상위 컨셉과 전역 원칙은 [`README.md`](./README.md), 컴포넌트별 사양은 [`components/`](./components/) 참조.

## ⚠️ 표기 규칙

각 토큰의 **현재 코드 반영 상태**를 표시한다. 이번 작업의 스코프는 문서화이며, `src/index.css`는 손대지 않는다 — ⚠️ 항목은 추후 토큰 동기화 작업의 체크리스트로 쓰인다.

| 표기           | 의미                                                     |
| -------------- | -------------------------------------------------------- |
| (없음)         | `src/index.css` `@theme`에 동일 의미의 토큰이 존재함     |
| ⚠️ **미정의**  | `@theme`에 토큰 없음 — 임시로 raw 값 또는 인접 토큰 사용 |
| ⚠️ **다른 값** | 동일/유사 이름의 토큰이 있으나 값이 사양과 다름          |

---

## 1. Color & Surface

### 1.1 Surface Palette

> 모든 면(surface)은 **무채색 그레이 스케일**로만 구성된다. 보더가 아닌 **톤 차이**로 구역을 분리하는 것이 이 시스템의 핵심.

| 토큰                        | Hex       | 용도                                                | 상태                                                                            |
| --------------------------- | --------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `surface` (= background)    | `#f8f9fa` | 앱의 기본 캔버스                                    | ⚠️ **다른 값** — 현재 `--color-background: hsl(0 0% 94%)` ≈ `#f0f0f0`           |
| `surface_container_lowest`  | `#ffffff` | 가장 위로 떠있는 카드/입력 표면                     | ⚠️ **다른 값** — 현재 `--color-card: hsl(0 0% 100%)` ≈ 동일하지만 의미명이 다름 |
| `surface_container_low`     | `#f1f4f6` | 사이드바, 보조 영역 배경                            | ⚠️ **미정의**                                                                   |
| `surface_container`         | `#eaeff1` | 카드를 얹어 lift 효과를 줄 때의 받침 면             | ⚠️ **미정의**                                                                   |
| `surface_container_high`    | `#e2e9ec` | Secondary 버튼 배경, 비활성 컨테이너                | ⚠️ **미정의**                                                                   |
| `surface_container_highest` | `#dbe4e7` | 사이드바의 "Selected" 상태, Knowledge Token 칩 배경 | ⚠️ **미정의**                                                                   |

### 1.2 Foreground (텍스트 / On-Surface)

| 토큰                 | Hex       | 용도                                                             | 상태                                                                                 |
| -------------------- | --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `on_surface`         | `#2b3437` | 중요 텍스트, 헤드라인. **순수 검정 금지** — 이 값을 쓴다.        | ⚠️ **다른 값** — 현재 `--color-foreground: hsl(220 35% 14%)` ≈ `#172238` (더 푸르름) |
| `on_surface_variant` | `#586064` | 본문 장문, 메타데이터. 가독성을 위해 본문에는 이 톤을 우선 사용. | ⚠️ **다른 값** — 현재 `--color-muted-foreground: hsl(0 0% 42%)` ≈ `#6b6b6b`          |
| `on_tertiary`        | `#faf8ff` | Primary 버튼 위의 텍스트 (보랏빛이 약간 도는 흰색)               | ⚠️ **미정의**                                                                        |

### 1.3 Accent (Tertiary)

> 이 시스템에서 액센트는 **단 하나**다. 의도가 분명한 액션(저장/추가/주요 링크)에만 쓴다.

| 토큰                 | Hex       | 용도                                               | 상태          |
| -------------------- | --------- | -------------------------------------------------- | ------------- |
| `tertiary`           | `#0053dc` | Primary 버튼 시작색, Ghost 버튼 텍스트, focus 보더 | ⚠️ **미정의** |
| `tertiary_container` | `#3e76fe` | Primary 버튼 그라데이션 끝색                       | ⚠️ **미정의** |

### 1.4 Outline (Fallback Only)

| 토큰              | Hex       | 용도                                                                 | 상태          |
| ----------------- | --------- | -------------------------------------------------------------------- | ------------- |
| `outline_variant` | `#abb3b7` | **Ghost Border 전용**. 항상 15% opacity로만 사용 — "선의 암시" 정도. | ⚠️ **미정의** |

### 1.5 Destructive

| 토큰          | Hex           | 용도                      | 상태                                              |
| ------------- | ------------- | ------------------------- | ------------------------------------------------- |
| `destructive` | (현재값 유지) | 삭제 액션 hover 텍스트 등 | (없음) `--color-destructive: hsl(0 84% 60%)` 활용 |

### 1.6 Surface Hierarchy — 어디에 무엇을

3계층 매핑. **결정 시 항상 이 표부터 본다.**

| 계층                | Surface                                | 적용 예                                |
| ------------------- | -------------------------------------- | -------------------------------------- |
| Base Layer          | `surface` (`#f8f9fa`)                  | 본문 영역 배경 (`<body>`, 메인 캔버스) |
| Secondary Zone      | `surface_container_low` (`#f1f4f6`)    | 사이드바, 보조 네비게이션 배경         |
| Interactive Element | `surface_container_lowest` (`#ffffff`) | 활성 작업 영역 카드, 입력 필드 표면    |

Lift 표현: **Interactive를 Secondary 위에 얹지 말고**, `surface_container_lowest` 카드를 `surface_container` 받침에 얹는다. 톤 한 단계 위/아래만으로 충분한 깊이가 생긴다.

### 1.7 The "No-Line" Rule

**1px solid border는 구역 분리 용도로 금지한다.** 경계는 배경 톤 차이로만 정의한다.

예시:

- 사이드바 ↔ 본문: `surface_container_low` 옆에 `surface`를 두면 경계는 _느껴진다_. `border-r`는 추가하지 않는다.
- 리스트 항목 사이: `divide-y` 금지. spacing.4 갭만 사용 (§3 참조).

### 1.8 The "Glass & Gradient" Rule

플로팅 요소(모달, 드롭다운, 호버 브레드크럼)와 Primary CTA에 한정해 적용한다.

| 적용 대상            | 사양                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Glassmorphism        | `surface` 80% opacity + `backdrop-filter: blur(12px)`                                                                                  |
| Primary CTA Gradient | `linear-gradient(to right, tertiary, tertiary_container)` — 평평한 단색 액센트가 주는 인공적인 느낌을 피하고 "보석 같은" 깊이를 만든다 |

### 1.9 Color — Do / Don't

**DO**

- 의미 기반 토큰만 사용한다 (`bg-card`, `text-foreground` 등). 새 색이 필요하면 `@theme`에 토큰부터 정의.
- 본문 장문은 `on_surface_variant`, 강조는 `on_surface`로 톤을 분리한다.
- 액센트(`tertiary`)는 화면당 의도 있는 액션 하나에만 — "어디를 클릭해야 하는지"가 한눈에 보이게.

**DON'T**

- ❌ 순수 검정(`#000000`) 텍스트. 항상 `on_surface`(`#2b3437`)를 쓴다 — 고급스러운 soft 한 톤을 잃는다.
- ❌ 원시 색(`bg-gray-500`, `text-blue-700` 등) 직접 사용. 의미 토큰을 거치지 않으면 시스템이 무너진다.
- ❌ 사이드바/섹션 분리에 `border`. 톤 차이만 사용.

---

## 2. Typography Scale

### 2.1 Font Family

| 역할       | 사양        | 현재 코드                                                                                                                                                           |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 본문       | Inter       | ⚠️ **다른 값** — Pretendard Variable 사용 중. **한글 가독성 우선으로 의도적 유지.** 이 문서의 scale/letter-spacing/line-height 규칙은 그대로 Pretendard에 적용한다. |
| 디스플레이 | (사양 없음) | Boogaloo (Google Fonts) — 학습용 헤더 강조에만 한정 사용                                                                                                            |

### 2.2 Type Scale

| 토큰          | 크기      | line-height | letter-spacing | 변형        | 용도                                                |
| ------------- | --------- | ----------- | -------------- | ----------- | --------------------------------------------------- |
| `display-lg`  | `3.5rem`  | (기본)      | `-0.02em`      | —           | 랜딩/히어로 영역. 타이트한 트래킹으로 bespoke 느낌. |
| `headline-md` | `1.75rem` | `1.4`       | (기본)         | —           | TIL/노트 제목. 넉넉한 line-height로 읽기 초대.      |
| `body-lg`     | `1rem`    | (기본)      | (기본)         | —           | 본문 워크호스.                                      |
| `label-md`    | `0.75rem` | (기본)      | `+0.05em`      | `uppercase` | 기능적 메타데이터. 내러티브와 구분.                 |

### 2.3 Color 매핑

- 본문 (body-lg, 장문): `on_surface_variant` — 눈의 피로를 줄인다.
- 강조 (인용, 첫 문장 등): `on_surface`로 전환.
- 헤드라인 (headline-md, display-lg): `on_surface`.
- 라벨 (label-md): `on_surface_variant`로 톤 다운.

### 2.4 Typography — Do / Don't

**DO**

- label은 항상 `uppercase` + `+0.05em` letter-spacing — 기능 정보를 내러티브에서 시각적으로 분리.
- 본문에 `line-height` `1.4` 이상 확보 — 읽는 공간을 만든다.
- weight는 scale에서 정의된 위계 내에서만 조정한다.

**DON'T**

- ❌ 순수 검정 텍스트. `on_surface` 사용.
- ❌ scale 외 임의 폰트 크기(`text-[17px]` 같은 한 번 쓰는 값). 위계가 깨진다.
- ❌ 본문에 `headline-md` 같은 헤드라인 토큰 재사용 — 위계 혼선.

---

## 3. Spacing

### 3.1 기본 리듬

**모든 간격은 `1.4rem` (= `spacing.4`)의 배수/약수로 호흡한다.** 시스템 전체에 일관된 운율을 만든다.

### 3.2 Spacing Scale

| 토큰         | 값        | 용도                                                |
| ------------ | --------- | --------------------------------------------------- |
| `spacing.1`  | `0.35rem` | 라벨 ↔ 입력 등 매우 좁은 갭                         |
| `spacing.2`  | `0.7rem`  | 헤드라인 ↔ 본문 (수직 리듬)                         |
| `spacing.4`  | `1.4rem`  | 리스트 항목 간 기본 갭, 컴포넌트 내부 패딩 기준     |
| `spacing.10` | `3.5rem`  | 큰 레이아웃 블록(섹션) 간 — "Atmospheric" 품질 유지 |

> Tailwind v4 기본 spacing scale은 0.25rem 단위다. 이 시스템은 별도 토큰으로 1.4rem 운율을 강제한다 — 토큰화 전까지는 `gap-[1.4rem]` 같은 인라인 값으로 잠정 표현한다. ⚠️ **미정의**

### 3.3 용도 매핑

| 상황               | 갭                    |
| ------------------ | --------------------- |
| 헤드라인 → 본문    | `spacing.2` (0.7rem)  |
| 리스트 아이템 사이 | `spacing.4` (1.4rem)  |
| 폼 라벨 → 입력     | `spacing.1` (0.35rem) |
| 섹션 ↔ 섹션        | `spacing.10` (3.5rem) |

### 3.4 Spacing — Do / Don't

**DO**

- 의심되면 여백을 **더 늘린다**. 화이트스페이스는 구조 요소다.
- 리스트 항목 사이는 spacing.4로 호흡 — 라인 없이 갭만으로 분리.

**DON'T**

- ❌ 리스트 항목 사이에 `divide-y` / `border-b` 추가. §1.7 No-Line Rule 위반.
- ❌ 임의 갭(`mt-[13px]` 같은) — scale 안에서 선택.

---

## 4. Elevation & Depth

### 4.1 Layering Principle (기본)

표준 카드는 그림자를 쓰지 않는다. **"Tonal Layering"으로 lift를 표현한다**:

```
surface_container         ← 받침 면 (#eaeff1)
└── surface_container_lowest 카드  ← lift된 표면 (#ffffff)
```

자연스러운 종이 겹침을 모사. 그림자 없이도 "위에 떠 있는" 느낌이 만들어진다.

### 4.2 Ambient Shadow (제한적 사용)

진짜 떠 있어야 하는 요소(예: "새 노트" 팝오버, 드롭다운 메뉴)에 한정해 사용한다.

| 속성       | 값                                                |
| ---------- | ------------------------------------------------- |
| blur       | `24px ~ 40px` (요소 크기에 비례)                  |
| opacity    | `on_surface` 색의 `6%`                            |
| color tint | accent(`tertiary`)를 살짝 섞어 팔레트 통일성 유지 |

> 잠정 Tailwind 표현 예: `shadow-[0_24px_40px_-12px_rgba(43,52,55,0.06)]` ⚠️ 토큰화 권장.

### 4.3 Ghost Border (Fallback Only)

배경이 너무 비슷해 접근성 문제가 있을 때만 사용하는 fallback.

| 속성    | 값                               |
| ------- | -------------------------------- |
| 토큰    | `outline_variant` (`#abb3b7`)    |
| opacity | **15%** (선의 암시, 경계가 아님) |
| 두께    | 1px                              |

### 4.4 Roundedness

| 용도                 | 값                   | 비고                                                                        |
| -------------------- | -------------------- | --------------------------------------------------------------------------- |
| Primary CTA (버튼)   | `0.375rem` (`md`)    | 사양 기본                                                                   |
| 카드 / 입력          | (components.md 참조) | 현재 코드는 `rounded-xl/2xl/3xl` 사용 — 컴포넌트 문서에서 컴포넌트별로 확정 |
| 칩 (Knowledge Token) | `full`               | 알약 모양                                                                   |

### 4.5 Elevation — Do / Don't

**DO**

- 카드는 톤 차이로 lift 표현. `surface_container_lowest` on `surface_container`가 표준.
- 그림자가 필요하면 사양대로 약하고 부드럽게, accent로 살짝 틴트.

**DON'T**

- ❌ 디폴트 `shadow-md`/`shadow-lg`. "designed"가 아니라 "engineered"로 보인다.
- ❌ Ghost Border를 일반적인 카드 경계로 사용. 접근성 fallback 한정.

---

## 5. 참조 링크

- 상위 컨셉과 전역 원칙: [`README.md`](./README.md)
- 컴포넌트별 사양과 Do/Don't: [`components/`](./components/)
- 현재 코드의 토큰 정의: `src/index.css` (3~16라인 `@theme` 블록)
- 폰트 로딩: `index.html` (8~17라인)
