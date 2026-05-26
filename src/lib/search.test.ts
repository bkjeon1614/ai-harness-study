import { describe, it, expect } from 'vitest';
import { matchesQuery } from './search';

describe('matchesQuery', () => {
  it('should return true when query is a substring of title (case-sensitive same)', () => {
    expect(matchesQuery({ title: 'React Hooks', content: '' }, 'React')).toBe(true);
  });

  it('should return true when query is a substring of content (case-sensitive same)', () => {
    expect(matchesQuery({ title: '', content: 'Built with React' }, 'React')).toBe(true);
  });

  it('should return true when query case differs from title or content (case-insensitive match)', () => {
    expect(matchesQuery({ title: 'React Hooks', content: '' }, 'react')).toBe(true);
    expect(matchesQuery({ title: '', content: 'react hooks' }, 'REACT')).toBe(true);
  });

  it('should return false when query is neither in title nor in content', () => {
    expect(matchesQuery({ title: 'React', content: 'Hooks' }, 'Vue')).toBe(false);
  });

  it('should return true exactly once (boolean OR, not double-counted) when query matches in both title and content', () => {
    expect(matchesQuery({ title: 'React Hooks', content: 'About React' }, 'React')).toBe(true);
  });

  it('should return true when query is empty string (no filter applied)', () => {
    expect(matchesQuery({ title: 'anything', content: 'anything' }, '')).toBe(true);
  });

  it('should return true when query is whitespace-only (trim → empty → no filter applied)', () => {
    expect(matchesQuery({ title: 'anything', content: 'anything' }, '   ')).toBe(true);
    expect(matchesQuery({ title: 'anything', content: 'anything' }, '\t\n')).toBe(true);
  });

  it('should match correctly when query has leading/trailing whitespace (trim applied before match)', () => {
    expect(matchesQuery({ title: 'React Hooks', content: '' }, '  React  ')).toBe(true);
    expect(matchesQuery({ title: 'React Hooks', content: '' }, '  Vue  ')).toBe(false);
  });

  it('should match multi-word query as a single substring (no token splitting; "front end" matches "front end" but not split)', () => {
    expect(matchesQuery({ title: 'front end engineer', content: '' }, 'front end')).toBe(true);
    expect(matchesQuery({ title: 'frontend engineer', content: '' }, 'front end')).toBe(false);
  });

  it('should match substring within longer word (e.g., "react" matches "reactor") — intentional per ADR-002', () => {
    expect(matchesQuery({ title: 'reactor design', content: '' }, 'react')).toBe(true);
  });

  it('should not throw for any combination of valid string inputs (totality of pure function)', () => {
    expect(() => matchesQuery({ title: '', content: '' }, '')).not.toThrow();
    expect(() => matchesQuery({ title: 'a', content: 'b' }, 'c')).not.toThrow();
    expect(() => matchesQuery({ title: '한글', content: '日本語' }, '中文')).not.toThrow();
  });

  it('should treat regex special characters in query as literal substring (no regex behavior)', () => {
    expect(matchesQuery({ title: 'price: $5.00 (USD)', content: '' }, '$5.00')).toBe(true);
    expect(matchesQuery({ title: 'plain text', content: '' }, '.*')).toBe(false);
    expect(matchesQuery({ title: 'a.b.c', content: '' }, '.')).toBe(true);
    expect(matchesQuery({ title: 'abc', content: '' }, '.')).toBe(false);
  });
});
