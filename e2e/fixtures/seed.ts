export interface SeedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const SEED_NOTES: SeedNote[] = [
  {
    id: 'seed-react',
    title: 'React Hooks 정리',
    content: 'useState, useEffect, useMemo 의 동작 원리.',
    tags: ['react', 'study'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'seed-todo',
    title: '이번 주 할 일',
    content: '운동, 책 읽기, 코드 리뷰 답글 달기.',
    tags: [],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'seed-ts',
    title: 'TypeScript 제네릭 노트',
    content: '조건부 타입과 infer 키워드를 활용한 패턴.',
    tags: ['typescript'],
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];
