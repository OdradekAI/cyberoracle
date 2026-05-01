import { test, expect } from '@playwright/test';

test.describe('M2 End-to-end user journey', () => {
  test('complete journey: home → crystal ball → result → history → share', async ({ page }) => {
    // ── Step 1: Home page loads with canvas ──
    await page.goto('/');
    await expect(page).toHaveTitle(/赛博玄学馆/);

    // Canvas elements present
    const canvases = page.locator('canvas');
    await expect(canvases).toHaveCount(2);

    // "赛博玄学馆" is rendered on canvas via NeonSigns, not as HTML.
    // Verify it's present in the canvas pixels instead.
    const neonPixels = await page.evaluate(() => {
      const canvas = document.querySelectorAll('canvas')[0] as HTMLCanvasElement;
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let purple = 0;
      for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3]! > 30 && data[i]! > 100 && data[i + 1]! < 100 && data[i + 2]! > 200) {
          purple++;
        }
      }
      return purple;
    });
    expect(neonPixels).toBeGreaterThan(0);

    // ── Step 2: Crystal ball visible and clickable ──
    // Crystal ball is at center of canvas (width/2, height/2)
    const viewport = page.viewportSize();
    const cx = (viewport?.width ?? 1280) / 2;
    const cy = (viewport?.height ?? 720) / 2;

    // Click crystal ball → triggers 4-act sequence
    await page.mouse.click(cx, cy);

    // Wait for sequence to progress (buildup phase at T+300ms)
    await page.waitForTimeout(800);

    // Verify buildup: particles burst (more bright pixels at center)
    const buildupPixels = await page.evaluate(() => {
      const canvas = document.querySelectorAll('canvas')[1] as HTMLCanvasElement;
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const w = canvas.width;
      const h = canvas.height;
      const data = ctx.getImageData(w * 0.4, h * 0.4, w * 0.2, h * 0.2).data;
      let bright = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3]! > 50 && data[i]! + data[i + 1]! + data[i + 2]! > 300) bright++;
      }
      return bright;
    });
    expect(buildupPixels).toBeGreaterThan(0);

    // Wait for full sequence to complete (~5s total)
    await page.waitForTimeout(5000);

    // ── Step 3: Navigate to result page (simulating post-upload flow) ──
    const testId = 'e2e-journey-test';
    await page.goto(`/result/${testId}?kind=palm`);
    await expect(page.locator('h1')).toContainText('命运解读');

    // Verify ID displayed
    await expect(page.locator('text=ID: e2e-journey-test')).toBeVisible();

    // Wait for stub simulation to complete (3.5s + buffer)
    await page.waitForTimeout(4500);

    // Verify sections appeared
    const sections = page.locator('h3');
    await expect(sections.first()).toBeVisible();
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(4);

    // Verify key section titles
    await expect(page.locator('h3', { hasText: '总览' })).toBeVisible();
    await expect(page.locator('h3', { hasText: '事业运' })).toBeVisible();

    // Progress bar at 100%
    const progressBar = page
      .locator('div')
      .filter({ has: page.locator('div') })
      .locator('div')
      .first();
    const progressWidth = await progressBar.evaluate(
      (el) => el.style.width || getComputedStyle(el).width,
    );
    expect(progressWidth).toContain('100');

    // ── Step 4: Export button present ──
    const exportLink = page.locator('a', { hasText: '导出长图' });
    await expect(exportLink).toBeVisible();
    await expect(exportLink).toHaveAttribute('href', `/api/result/${testId}/image`);

    // ── Step 5: History entry created ──
    await page.goto('/history');

    // Should have at least one entry (the one we just created)
    const historyEntries = page.locator('button').filter({ hasText: /手相|面相/ });
    await expect(historyEntries.first()).toBeVisible({ timeout: 3000 });

    // Verify the entry has correct type
    await expect(historyEntries.first()).toContainText('手相');

    // ── Step 6: Click history entry → result page ──
    await historyEntries.first().click();
    await expect(page).toHaveURL(/\/result\//);
    await expect(page.locator('h1')).toContainText('命运解读');

    // Sections should still be visible (stub sim again)
    await page.waitForTimeout(4500);
    await expect(page.locator('h3').first()).toBeVisible();

    // ── Step 7: Share page loads with funnel CTA ──
    await page.goto(`/share/${testId}`);

    // Funnel CTA visible
    const ctaLink = page.locator('a', { hasText: '下载桌面版' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/download');

    // Result iframe loads
    const iframe = page.locator('iframe[title="命运解读"]');
    await expect(iframe).toBeVisible();

    // ── Step 8: Download page with platform buttons ──
    await page.goto('/download');
    await expect(page.locator('h1')).toContainText('赛博玄学馆 桌面版');

    const comingSoonLabels = page.locator('span', { hasText: '即将上线' });
    await expect(comingSoonLabels).toHaveCount(3);
  });

  test('home page performance: canvas renders within budget', async ({ page }) => {
    // Clear console errors for clean measurement
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const start = Date.now();
    await page.goto('/');
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    const loadTime = Date.now() - start;

    // Home page should render quickly (canvas visible under 3s)
    expect(loadTime).toBeLessThan(3000);

    // Two canvases present (background + main)
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBe(2);

    // Tier config available (perf detection working)
    const tierConfig = await page.evaluate(() => {
      return (window as unknown as Record<string, unknown>).__tierConfig;
    });
    expect(tierConfig).toBeDefined();
    expect(tierConfig).toHaveProperty('particles');
    expect(tierConfig).toHaveProperty('maxShadowBlur');

    // No critical console errors (favicon 404 is expected)
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('404'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('mobile viewport: canvas and pages work at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Home page renders at mobile width
    await page.goto('/');
    await expect(page.locator('canvas').first()).toBeVisible();

    // Canvas dimensions should match viewport
    const canvasBox = await page.locator('canvas').first().boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBe(375);

    // Result page works on mobile
    await page.goto('/result/mobile-test?kind=face');
    await expect(page.locator('h1')).toContainText('命运解读');
    await page.waitForTimeout(4500);
    await expect(page.locator('h3').first()).toBeVisible();

    // History page works on mobile
    await page.goto('/history');
    await expect(page.locator('h1')).toContainText('解读记录');

    // Download page works on mobile
    await page.goto('/download');
    await expect(page.locator('h1')).toContainText('赛博玄学馆 桌面版');
    const comingSoon = page.locator('span', { hasText: '即将上线' });
    await expect(comingSoon).toHaveCount(3);
  });

  test('typecheck passes for all packages', async () => {
    // This is verified by the harness before each session, but we confirm
    // it as part of the E2E acceptance
    const { execSync } = await import('child_process');
    const result = execSync('pnpm typecheck', {
      cwd: 'D:/Luiz/Odradek/cyberoracle',
      encoding: 'utf8',
      timeout: 30000,
    });
    expect(result).toContain('successful');
  });
});
