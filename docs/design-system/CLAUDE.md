# docs/design-system/ 작업 가이드

이 폴더는 노트 앱의 **모든 스타일 작업의 단일 참조점**이다. Claude가 이 폴더 안 파일을 다루거나 스타일 관련 작업을 할 때 이 가이드를 따른다.

## 진입 순서

1. [`README.md`](./README.md) — 컨셉(The Digital Atelier), 핵심 원칙 4가지, 전역 Do/Don't
2. [`tokens.md`](./tokens.md) — 색·타이포·공간·elevation의 raw 값 (검색용 단일 표)
3. [`components/`](./components/) — 컴포넌트별 사양과 Do/Don't (1파일 = 1컴포넌트)

## 작업 트리거별 읽을 파일 (컨텍스트 절약)

| 작업                | 먼저 읽을 파일                                 | 보조로                |
| ------------------- | ---------------------------------------------- | --------------------- |
| 새 컴포넌트 추가    | `components/README.md` (템플릿/체크리스트)     | `tokens.md`           |
| 기존 컴포넌트 수정  | `components/<name>.md` **1개만**               | (필요 시) `tokens.md` |
| 새 토큰 추가        | `tokens.md` + 루트 `src/index.css`             | —                     |
| 색/타이포/간격 결정 | `tokens.md`                                    | —                     |
| 스타일 PR 리뷰      | `README.md` 전역 Do/Don't + 해당 컴포넌트 파일 | —                     |
| 컨셉/원칙 갱신      | `README.md` §1~2                               | —                     |

**원칙**: 컴포넌트 1개만 만지는 작업이면 그 컴포넌트 파일 1개만 Read. README/tokens를 매번 통째로 로드하지 않는다.

## 갱신 규칙

- 새 컴포넌트 → `components/<kebab-case>.md` 신규 + `components/README.md` "컴포넌트 목록" 표에 1행 추가
- 새 토큰 → `tokens.md` 표 항목 + (가능하면) `src/index.css` `@theme` 동시 갱신, ⚠️ 해소
- 원칙(Creative North Star, 핵심 원칙 4가지) 변경 → `README.md` §1~2 갱신
- ⚠️ 표기는 "코드에 미반영" 추적용 — 토큰을 `@theme`에 정의하는 순간 해당 ⚠️ 제거

## 미반영(⚠️) 토큰을 코드에 써야 할 때

`src/index.css` `@theme`에 토큰이 없으면 인라인 hex(`bg-[#f1f4f6]`)로 잠정 표현하되, PR 설명에 "⚠️ 토큰화 필요" 메모. **같은 미정의 토큰이 3곳 이상**에서 쓰이면 `@theme` 정의를 별도 작업으로 제안한다.

## 폰트 정책

사양은 Inter지만 한글 가독성 우선으로 **Pretendard 유지**가 결정된 사항. 이 문서의 scale/letter-spacing/line-height 규칙은 그대로 Pretendard에 적용한다. 폰트 자체를 바꾸는 PR은 별도 합의가 필요하다.
