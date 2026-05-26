# Input

> 토큰값은 [`../tokens.md`](../tokens.md), 상위 원칙은 [`../README.md`](../README.md), 공통 인터랙션은 [`./README.md`](./README.md) 참조.

## 컨셉

> 평소엔 거의 보이지 않는 표면. **focus 순간에만 accent가 한 줄** 그어진다 — "지금 여기에 쓰고 있다"는 신호.

## 사양 — Text Input

| 속성           | 값                                                                          |
| -------------- | --------------------------------------------------------------------------- |
| 배경           | `surface_container_lowest` (`#ffffff`)                                      |
| 텍스트         | `on_surface` (`#2b3437`) ⚠️ 현재 `--color-foreground`와 값 다름             |
| 보더 (기본)    | Ghost Border — `outline_variant` (`#abb3b7`) **15% opacity**, 1px ⚠️ 미정의 |
| 보더 (focus)   | `tertiary` (`#0053dc`), 1px ⚠️ 미정의                                       |
| placeholder 색 | `on_surface_variant` (`#586064`) ⚠️ 다른 값                                 |
| radius         | `rounded-md` ~ `rounded-xl` (사양 미명시 — 인접 컴포넌트와 일관성 유지)     |

## 사양 — Label

| 속성        | 값                                                            |
| ----------- | ------------------------------------------------------------- |
| 타입        | `label-md` — `0.75rem`, `uppercase`, letter-spacing `+0.05em` |
| 색          | `on_surface_variant` (`#586064`)                              |
| 위치        | 입력 **위에** 배치                                            |
| 입력과의 갭 | `spacing.1` (0.35rem)                                         |

## Tailwind 예 (잠정)

```html
<div class="flex flex-col gap-[0.35rem]">
  <label class="text-xs uppercase tracking-[0.05em] text-[#586064]"> 제목 </label>
  <input
    class="rounded-md bg-white px-3 py-2 text-[#2b3437]
           border border-[#abb3b7]/[0.15]
           focus:border-[#0053dc] focus:outline-none transition"
    placeholder="노트 제목..."
  />
</div>
```

## Do / Don't

**DO**

- 라벨은 항상 입력 **위**에 배치, `uppercase` + letter-spacing으로 기능 신호화.
- Focus 시에만 accent 보더가 나타나도록 — 평소에 액센트를 낭비하지 않는다.

**DON'T**

- ❌ placeholder를 라벨 대체로 사용. 글자가 들어가면 라벨이 사라져 맥락이 깨진다.
- ❌ 기본 상태에서 진한 보더(`border-gray-300` 등). Ghost Border(15% opacity) 또는 보더 없음.
- ❌ Focus 시 외곽선(`outline`)과 보더가 동시에 변하면서 화면이 튀게 만들기 — focus 시그널은 보더 1줄로 충분.
