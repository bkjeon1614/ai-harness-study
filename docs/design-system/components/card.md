# Card

> 토큰값은 [`../tokens.md`](../tokens.md), 상위 원칙은 [`../README.md`](../README.md), 공통 인터랙션은 [`./README.md`](./README.md) 참조.
> 리스트 항목은 [`./list.md`](./list.md)에서 별도로 다룬다.

## 컨셉

> 종이 한 장을 받침 위에 살짝 얹은 듯한 느낌. **그림자가 아닌 톤 차이**로 lift를 만든다 (Tonal Layering).

## 사양

| 속성                     | 값                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 배경                     | `surface_container_lowest` (`#ffffff`) ⚠️ 의미명 미정의 (현재 `--color-card` 활용 가능)                       |
| 받침 (부모 surface)      | `surface_container` (`#eaeff1`) ⚠️ 미정의                                                                     |
| 보더                     | **없음**                                                                                                      |
| radius                   | `rounded-2xl` 또는 `rounded-3xl` (현재 코드 컨벤션 따름)                                                      |
| 내부 패딩                | `spacing.4` (`p-[1.4rem]` ⚠️ 또는 `p-6`~`p-8` 잠정)                                                           |
| hover (클릭 가능 카드만) | 배경을 살짝 톤 다운 (`surface` → `surface_container_low`)                                                     |
| 그림자                   | **없음** (필요 시 [`../tokens.md` §4.2](../tokens.md#42-ambient-shadow-제한적-사용) Ambient Shadow 사양 따름) |

## Tailwind 예 (현재 코드 토큰 활용)

```html
<section class="bg-[#eaeff1] p-10">
  <!-- 받침 면 (surface_container) -->
  <article class="bg-card rounded-3xl p-8">
    <!-- lift된 카드 -->
    ...
  </article>
</section>
```

## Do / Don't

**DO**

- 카드 lift는 항상 톤 한 단계 차이로. `surface_container_lowest` on `surface_container`가 표준 조합.
- 클릭 가능한 카드는 hover 시 배경 톤만 살짝 변화 — 그림자나 transform 없이.

**DON'T**

- ❌ 카드에 `shadow-md`/`shadow-lg` 같은 디폴트 그림자. Tonal Layering으로 충분, 디폴트 그림자는 "engineered" 느낌.
- ❌ 카드를 같은 톤(`surface` on `surface`) 위에 얹기. 받침이 안 보이면 떠 있는 느낌이 사라진다.
- ❌ 카드 경계를 `border`로 정의. No-Line Rule 위반 — 톤 차이만으로.
