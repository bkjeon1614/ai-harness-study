import { test, expect } from '@playwright/test';
import { resetDb } from '../fixtures/api';

test.describe('tags display', () => {
  test.beforeEach(async () => {
    await resetDb();
  });

  test('renders tag chips for a note that has tags', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'React Hooks 정리' }).click();

    const tagArea = page.getByTestId('tag-area');
    await expect(tagArea.getByText('react')).toBeVisible();
    await expect(tagArea.getByText('study')).toBeVisible();
  });

  test('renders a single tag chip for a note with one tag', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'TypeScript 제네릭 노트' }).click();

    const tagArea = page.getByTestId('tag-area');
    await expect(tagArea.getByText('typescript')).toBeVisible();
  });

  test('shows an empty tag area for a note without tags', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: '이번 주 할 일' }).click();

    const tagArea = page.getByTestId('tag-area');
    await expect(tagArea).toBeAttached();
    await expect(tagArea.locator('span')).toHaveCount(0);
  });
});
