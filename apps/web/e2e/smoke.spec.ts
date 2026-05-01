import { test, expect } from '@playwright/test';

test.describe('Web smoke tests', () => {
  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/赛博玄学馆|CyberOracle/);
  });

  test('home page renders canvas with 4-layer architecture', async ({ page }) => {
    await page.goto('/');
    const canvases = page.locator('canvas');
    await expect(canvases).toHaveCount(2);
    await expect(canvases.first()).toBeVisible();
  });
});

test.describe('Server smoke tests', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/health');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('number');
  });

  test('health endpoint reports core package integration', async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/health');
    const body = await res.json();
    expect(body.packages.core).toBe('@cyberoracle/core');
    expect(body.contentSafety).toBe(true);
  });
});
