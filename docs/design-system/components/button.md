# Button

> 토큰값은 [`../tokens.md`](../tokens.md), 상위 원칙은 [`../README.md`](../README.md), 공통 인터랙션(hover/focus/disabled)은 [`./README.md`](./README.md) 참조.

3종 — Primary / Secondary / Tertiary(Ghost). **화면당 Primary는 단 하나.**

## 1. Primary

> **컨셉**: 화면당 하나의 "이 액션을 해주세요"를 시각적으로 외치는 요소. 그라데이션으로 평평하지 않은 깊이를 부여한다.

| 속성     | 값                                                                                          |
| -------- | ------------------------------------------------------------------------------------------- |
| 배경     | `linear-gradient(to right, tertiary, tertiary_container)` (`#0053dc` → `#3e76fe`) ⚠️ 미정의 |
| 텍스트   | `on_tertiary` (`#faf8ff`) ⚠️ 미정의                                                         |
| 보더     | 없음                                                                                        |
| radius   | `0.375rem` (Tailwind `rounded-md`)                                                          |
| hover    | 그라데이션 톤을 한 단계 진하게 (또는 `brightness-95`)                                       |
| focus    | accent 1px ring + 오프셋 2px                                                                |
| disabled | opacity 50%, cursor not-allowed                                                             |

**Tailwind 예 (잠정)**:

```html
<!-- ⚠️ tertiary/tertiary_container 토큰화 전까지 인라인 그라데이션 -->
<button
  class="rounded-md px-4 py-2 text-sm font-semibold text-[#faf8ff]
               bg-gradient-to-r from-[#0053dc] to-[#3e76fe]
               hover:brightness-95 transition disabled:opacity-50"
>
  저장
</button>
```

## 2. Secondary

> **컨셉**: 함께 제공되는 보조 액션. 존재감은 있지만 시선을 뺏지 않는다. **보더 없이** 톤 차이로 클릭 가능함을 표현.

| 속성     | 값                                                             |
| -------- | -------------------------------------------------------------- |
| 배경     | `surface_container_high` (`#e2e9ec`) ⚠️ 미정의                 |
| 텍스트   | `on_surface` (`#2b3437`)                                       |
| 보더     | **없음**                                                       |
| radius   | `0.375rem`                                                     |
| hover    | 배경 한 단계 더 진하게 (`surface_container_highest` `#dbe4e7`) |
| focus    | accent 1px ring                                                |
| disabled | opacity 50%                                                    |

**Tailwind 예**:

```html
<button
  class="rounded-md px-4 py-2 text-sm font-medium
               bg-[#e2e9ec] text-[#2b3437]
               hover:bg-[#dbe4e7] transition disabled:opacity-50"
>
  취소
</button>
```

## 3. Tertiary (Ghost)

> **컨셉**: 부차적/반복적 액션. 평소엔 배경 없이 텍스트만, hover 시에만 accent의 흔적이 드러난다.

| 속성     | 값                               |
| -------- | -------------------------------- |
| 배경     | 없음 (transparent)               |
| 텍스트   | `tertiary` (`#0053dc`) ⚠️ 미정의 |
| 보더     | 없음                             |
| radius   | `0.375rem`                       |
| hover    | accent 색의 **2% opacity** 배경  |
| focus    | accent 1px ring                  |
| disabled | opacity 50%                      |

**Tailwind 예**:

```html
<button
  class="rounded-md px-3 py-2 text-sm font-medium text-[#0053dc]
               hover:bg-[#0053dc]/[0.02] transition disabled:opacity-50"
>
  더보기
</button>
```

## 4. Do / Don't

**DO**

- 화면당 Primary는 **단 하나**. 위계가 무너지면 그라데이션의 의미가 사라진다.
- Secondary와 Tertiary는 Primary 옆에 자연스럽게 페어링 — 보더 없는 디자인이 화면의 "선 개수"를 줄여준다.
- 모든 버튼은 `rounded-md`(0.375rem) — 카드의 `rounded-xl/2xl/3xl`과 구분되어 "누를 수 있는 요소"라는 신호를 준다.

**DON'T**

- ❌ 같은 화면에 Primary 버튼 2개 이상. "어디를 눌러야 하지?" 혼란.
- ❌ Secondary 버튼에 보더 추가. No-Line Rule 위반.
- ❌ 평평한 단색 accent 버튼. 그라데이션을 빼면 "engineered" 느낌으로 되돌아간다.
