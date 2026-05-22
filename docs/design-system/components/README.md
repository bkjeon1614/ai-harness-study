# Components — The Digital Atelier

> 컴포넌트별 스타일 사양과 Do/Don't. **1파일 = 1컴포넌트**.
> 토큰값/이름은 [`../tokens.md`](../tokens.md), 상위 컨셉은 [`../README.md`](../README.md) 참조.

## 컴포넌트 목록

| 컴포넌트               | 파일                                         | 한 줄                                                 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Button                 | [`button.md`](./button.md)                   | Primary(그라데이션) / Secondary / Tertiary(Ghost) 3종 |
| Card                   | [`card.md`](./card.md)                       | 종이 한 장을 받침 위에 얹은 듯한 lift                 |
| List                   | [`list.md`](./list.md)                       | 라인 없이 갭만으로 분리되는 항목 흐름                 |
| Input                  | [`input.md`](./input.md)                     | 평소엔 보이지 않다 focus 시 accent 한 줄              |
| Knowledge Token (Chip) | [`knowledge-token.md`](./knowledge-token.md) | 토픽 분류 라벨 (#javascript, #design 등)              |

## 모든 컴포넌트 파일의 템플릿

새 컴포넌트 추가 시 동일 구조 유지:

1. **컨셉** — 디자인 의도 한 줄
2. **사양 표** — 배경 / 텍스트 / 보더 / radius / hover / focus / disabled
3. **Tailwind v4 매핑 예** — 어떤 클래스 조합이 될지. 토큰 미정의 항목은 ⚠️ + 잠정 표현 (인라인 hex)
4. **Do / Don't** — 각 최소 2개

## 글로벌 인터랙션 패턴

모든 컴포넌트가 공통으로 따르는 규칙. 컴포넌트 파일에서 중복 기술하지 않는다.

### Hover Transition

- 색/배경 전환은 **`transition`** 한 줄로 통일 (Tailwind 기본 ~150ms).
- 갑작스러운 색 점프 금지.

### Focus Ring

- 키보드 포커스는 항상 시각적으로 나타나야 한다 (접근성).
- 기본: `tertiary` (`#0053dc`) 색의 1px ring + 2px offset.

### Disabled

- 모든 disabled는 `opacity: 50%` + `cursor: not-allowed` 일관 적용.
- 별도 회색 색상으로 바꾸지 않는다 — opacity로만 표현하면 어느 컴포넌트든 같은 룰로 처리 가능.

## 신규 컴포넌트 추가 체크리스트

- [ ] `components/<kebab-case>.md` 생성, 위 템플릿 4섹션 모두 채움
- [ ] 위 "컴포넌트 목록" 표에 1행 추가
- [ ] 사용된 토큰이 `../tokens.md`에 정의되어 있는지 확인 — 없으면 ⚠️ 표기 후 raw hex 잠정 사용
- [ ] Do/Don't 최소 2개씩
- [ ] 위 "글로벌 인터랙션 패턴"으로 처리 가능한 항목은 컴포넌트 파일에서 중복 기술하지 않음
