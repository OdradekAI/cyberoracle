import { test, expect } from '@playwright/test';

test.describe('Share page', () => {
  test('renders result content with funnel CTA bar', async ({ page }) => {
    await page.goto('/share/test-share-123');

    // CTA bar visible above the fold
    const ctaLink = page.locator('a', { hasText: '下载桌面版' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/download');

    const ctaText = page.locator('text=获得更深度的玄学体验');
    await expect(ctaText).toBeVisible();

    // CTA bar is sticky (position: sticky)
    const ctaBar = ctaLink.locator('..');
    const position = await ctaBar.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('sticky');

    // Result content via iframe
    const iframe = page.locator('iframe[title="命运解读"]');
    await expect(iframe).toBeVisible();
  });

  test('SEO metadata present', async ({ page }) => {
    const response = await page.goto('/share/test-share-123');
    expect(response).not.toBeNull();

    const title = await page.title();
    expect(title).toContain('命运解读');
    expect(title).toContain('赛博玄学馆');

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toContain('命运解读');
  });
});

test.describe('Download page', () => {
  test('renders coming-soon page with 3 platform buttons', async ({ page }) => {
    await page.goto('/download');

    // Title
    await expect(page.locator('h1')).toContainText('赛博玄学馆 桌面版');

    // 3 feature bullets
    await expect(page.locator('text=Live2D 桌面伙伴')).toBeVisible();
    await expect(page.locator('text=全局快捷呼出')).toBeVisible();
    await expect(page.locator('text=本地加密历史')).toBeVisible();

    // 3 platform buttons with "即将上线" label
    const comingSoonLabels = page.locator('span', { hasText: '即将上线' });
    await expect(comingSoonLabels).toHaveCount(3);

    await expect(page.locator('text=macOS Universal')).toBeVisible();
    await expect(page.locator('text=Windows x64')).toBeVisible();
    await expect(page.locator('text=Linux AppImage')).toBeVisible();

    // Back to home link
    const homeLink = page.locator('a', { hasText: '返回首页' });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });

  test('SEO metadata present', async ({ page }) => {
    await page.goto('/download');

    const title = await page.title();
    expect(title).toContain('下载桌面版');
    expect(title).toContain('赛博玄学馆');

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toContain('桌面版');
    expect(description).toContain('Live2D');
  });
});
