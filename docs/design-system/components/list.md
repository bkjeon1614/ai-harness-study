# List

> 토큰값은 [`../tokens.md`](../tokens.md), 상위 원칙은 [`../README.md`](../README.md), 공통 인터랙션은 [`./README.md`](./README.md) 참조.
> 카드 표면은 [`./card.md`](./card.md)에서 별도로 다룬다.

## 컨셉

> 항목 사이에 라인이 없다. **갭만으로** 분리한다. 시선이 끊기지 않고 흐른다.

## 사양

| 속성                | 값                                                                |
| ------------------- | ----------------------------------------------------------------- |
| 항목 간 갭          | `spacing.4` (1.4rem)                                              |
| 항목 hover 배경     | `surface` → `surface_container_low` (`#f1f4f6`) 전환 ⚠️ 미정의    |
| 선택(Selected) 상태 | `surface_container_highest` (`#dbe4e7`) 배경 ⚠️ 미정의            |
| 항목 radius         | `rounded-xl` (약한 라운드 — 카드의 `rounded-2xl/3xl`과 위계 차이) |
| divider             | **금지**                                                          |

## Tailwind 예

```html
<ul class="flex flex-col gap-[1.4rem]">
  <li class="rounded-xl px-4 py-3 hover:bg-[#f1f4f6] transition">...</li>
  <li class="rounded-xl px-4 py-3 bg-[#dbe4e7]">...선택됨</li>
</ul>
```

## Do / Don't

**DO**

- 항목 사이는 `gap-[1.4rem]`(spacing.4) — 라인 없이 갭만으로 분리.
- 선택 상태는 `surface_container_highest`(가장 진한 surface) — "현재 여기에 있다"는 시각 앵커.
- 항목 자체는 `rounded-xl` 정도의 약한 라운드 — 카드와의 위계 차이를 만든다.

**DON'T**

- ❌ `divide-y`, `border-b`로 항목 구분. No-Line Rule 위반 — 갭만 사용.
- ❌ 항목 사이에 점선·점 같은 시각적 구분자 추가. "atmospheric"한 흐름이 깨진다.
- ❌ hover 시 배경 색이 크게 점프하는 전환. 같은 surface 톤 한 단계 위로만 이동.
