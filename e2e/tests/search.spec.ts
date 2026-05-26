import { test, expect } from '@playwright/test';
import { resetDb } from '../fixtures/api';

test.describe('search', () => {
  test.beforeEach(async () => {
    await resetDb();
  });

  test('filters by title keyword', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('키워드로 검색...').fill('TypeScript');

    await expect(page.getByRole('heading', { name: 'TypeScript 제네릭 노트' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'React Hooks 정리' })).toHaveCount(0);
    await expect(page.getByText('노트 1개')).toBeVisible();
  });

  test('filters by content keyword', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('키워드로 검색...').fill('운동');

    await expect(page.getByRole('heading', { name: '이번 주 할 일' })).toBeVisible();
    await expect(page.getByText('노트 1개')).toBeVisible();
  });

  test('is case-insensitive', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('키워드로 검색...').fill('REACT');

    await expect(page.getByRole('heading', { name: 'React Hooks 정리' })).toBeVisible();
    await expect(page.getByText('노트 1개')).toBeVisible();
  });

  test('shows empty result message when no note matches', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('키워드로 검색...').fill('zzz-no-match-zzz');

    await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
  });

  test('clearing the query restores the full list', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('키워드로 검색...');

    await search.fill('TypeScript');
    await expect(page.getByText('노트 1개')).toBeVisible();

    await search.fill('');
    await expect(page.getByText('노트 3개')).toBeVisible();
  });
});
