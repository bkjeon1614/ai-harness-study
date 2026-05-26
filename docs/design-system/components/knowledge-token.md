# Knowledge Token (Chip)

> 토큰값은 [`../tokens.md`](../tokens.md), 상위 원칙은 [`../README.md`](../README.md), 공통 인터랙션은 [`./README.md`](./README.md) 참조.

## 컨셉

> TIL의 토픽 태그(#javascript, #design)를 위한 알약 모양 요소. **버튼이 아니다** — 분류 메타데이터를 시각적으로 묶는 라벨.

## 사양

| 속성        | 값                                                                                |
| ----------- | --------------------------------------------------------------------------------- |
| 배경        | `surface_container_highest` (`#dbe4e7`) ⚠️ 미정의                                 |
| 텍스트      | `on_surface_variant` (`#586064`) ⚠️ 다른 값                                       |
| 보더        | **없음**                                                                          |
| radius      | `full` (알약 모양)                                                                |
| 패딩        | 좌우 충분히, 상하 좁게 (예: `px-3 py-1`)                                          |
| 텍스트 크기 | `text-xs` 또는 `label-md`                                                         |
| 변형        | **`uppercase` 적용하지 않음** — 태그명을 입력 그대로 보존 (`tag` 기능 Q4 룰 참조) |

## Tailwind 예

```html
<span
  class="inline-flex items-center rounded-full px-3 py-1 text-xs
             bg-[#dbe4e7] text-[#586064]"
>
  javascript
</span>
```

## Do / Don't

**DO**

- 토픽 분류/메타데이터 표시에 사용.
- `rounded-full`로 다른 사각형 요소들과 시각적으로 분리 — "이건 분류다"라는 신호.
- 칩끼리는 `gap-2` 정도로 촘촘하게 — 시각적 그룹 형성.

**DON'T**

- ❌ 클릭형 액션 버튼 대용으로 쓰지 않는다. 사용자는 칩을 "정보"로 인식한다.
- ❌ 보더 추가. surface 톤만으로 분리.
- ❌ accent 색(`tertiary`)을 칩 배경에 사용. 액센트는 액션 전용.
