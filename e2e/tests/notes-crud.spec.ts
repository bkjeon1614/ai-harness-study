import { test, expect, type Page } from '@playwright/test';
import { resetDb, clearDb } from '../fixtures/api';

function card(page: Page, title: string) {
  return page.locator('[class*="rounded-2xl"]').filter({ hasText: title });
}

test.describe('notes CRUD', () => {
  test.beforeEach(async () => {
    await resetDb();
  });

  test('loads seeded notes into the sidebar', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'React Hooks 정리' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '이번 주 할 일' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'TypeScript 제네릭 노트' })).toBeVisible();
    await expect(page.getByText('노트 3개')).toBeVisible();
  });

  test('shows empty state when there are no notes', async ({ page }) => {
    await clearDb();
    await page.goto('/');

    await expect(page.getByText('노트가 없습니다')).toBeVisible();
  });

  test('shows placeholder in main area before selection', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('노트를 선택하거나 새 노트를 만드세요')).toBeVisible();
  });

  test('selecting a note populates the editor', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('heading', { name: 'React Hooks 정리' }).click();

    await expect(page.getByPlaceholder('제목')).toHaveValue('React Hooks 정리');
    await expect(page.getByPlaceholder('내용을 입력하세요...')).toHaveValue(
      'useState, useEffect, useMemo 의 동작 원리.',
    );
  });

  test('creates a new note via the editor', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '+ 새 노트' }).click();

    await expect(page.getByText('새 노트', { exact: true })).toBeVisible();
    await page.getByPlaceholder('제목').fill('E2E 새 노트');
    await page.getByPlaceholder('내용을 입력하세요...').fill('Playwright 로 생성한 노트');
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByRole('heading', { name: 'E2E 새 노트' })).toBeVisible();
    await expect(page.getByText('노트 4개')).toBeVisible();
  });

  test('does not save when title is empty', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '+ 새 노트' }).click();

    await page.getByPlaceholder('내용을 입력하세요...').fill('제목 없는 노트');
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByText('노트 3개')).toBeVisible();
    await expect(page.getByText('새 노트', { exact: true })).toBeVisible();
  });

  test('updates an existing note', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: '이번 주 할 일' }).click();

    await page.getByPlaceholder('제목').fill('이번 주 할 일 (수정)');
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByRole('heading', { name: '이번 주 할 일 (수정)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '이번 주 할 일', exact: true })).toHaveCount(0);
  });

  test('deletes a note from the list', async ({ page }) => {
    await page.goto('/');

    await card(page, 'TypeScript 제네릭 노트').getByRole('button', { name: '삭제' }).click();

    await expect(page.getByRole('heading', { name: 'TypeScript 제네릭 노트' })).toHaveCount(0);
    await expect(page.getByText('노트 2개')).toBeVisible();
  });

  test('cancel discards unsaved edits', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'React Hooks 정리' }).click();

    await page.getByPlaceholder('제목').fill('변경된 제목');
    await page.getByRole('button', { name: '취소' }).click();

    await expect(page.getByRole('heading', { name: 'React Hooks 정리' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '변경된 제목' })).toHaveCount(0);
  });
});
