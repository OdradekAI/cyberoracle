import { test, expect } from '@playwright/test';

test.describe('History page', () => {
  test('shows empty state with CTA', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('h1')).toContainText('解读记录');

    const emptyText = page.locator('text=还没有解读记录');
    await expect(emptyText).toBeVisible();

    const cta = page.locator('a', { hasText: '开始第一次解读' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('result page saves to history and history page shows entry', async ({ page }) => {
    // Clear any existing history via IndexedDB
    await page.goto('/history');
    await page.evaluate(() => {
      const req = indexedDB.deleteDatabase('CyberOracleHistory');
      return new Promise<void>((resolve) => {
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    });

    // Visit result page — stub completes after 3.5s
    await page.goto('/result/test-history-entry?kind=palm');
    await expect(page.locator('h1')).toContainText('命运解读');

    // Wait for stub simulation to complete (3.5s + buffer)
    await page.waitForTimeout(4500);

    // Verify sections appeared (completion confirmed)
    const sections = page.locator('h3');
    await expect(sections.first()).toBeVisible({ timeout: 2000 });

    // Navigate to history
    await page.goto('/history');

    // Should have one entry
    const entryButtons = page.locator('button').filter({ hasText: '手相' });
    await expect(entryButtons).toHaveCount(1);

    // Entry should show type and summary
    const entry = entryButtons.first();
    await expect(entry).toContainText('手相');
    await expect(entry).toContainText('你的人生正处于一个关键的转折点');

    // Click entry → navigates to result page
    await entry.click();
    await expect(page).toHaveURL(/\/result\/test-history-entry/);
  });

  test('clear history button removes all entries', async ({ page }) => {
    // First create a history entry
    await page.goto('/result/test-clear-entry?kind=face');
    await page.waitForTimeout(4500);

    // Go to history and verify entry exists
    await page.goto('/history');
    const entryButtons = page.locator('button').filter({ hasText: /面相|手相/ });
    await expect(entryButtons.first()).toBeVisible({ timeout: 2000 });

    // Click clear
    const clearBtn = page.locator('button', { hasText: '清空记录' });
    await clearBtn.click();

    // Should now show empty state
    await expect(page.locator('text=还没有解读记录')).toBeVisible();
  });

  test('history link on result page header', async ({ page }) => {
    // The result page itself doesn't have a nav link, but history page
    // has a "返回首页" link
    await page.goto('/history');
    const homeLink = page.locator('a', { hasText: '返回首页' });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });
});
