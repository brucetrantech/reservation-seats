import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/login');

    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');

    // Login page should contain Google login reference
    const hasLoginUI = content?.includes('Google') ||
                       content?.includes('Sign in') ||
                       content?.includes('Login') ||
                       content?.includes('login');
    expect(hasLoginUI).toBe(true);
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access a protected page without auth
    await page.goto('/payment');
    await page.waitForLoadState('networkidle');

    // Should redirect to login or show auth prompt
    const url = page.url();
    const content = await page.textContent('body');

    const isRedirectedOrBlocked =
      url.includes('login') ||
      content?.includes('Sign in') ||
      content?.includes('Login') ||
      content?.includes('Google');

    expect(isRedirectedOrBlocked).toBe(true);
  });

  test('should have Google OAuth login button/link', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Look for a Google login button or link
    const googleButton = page.locator('a[href*="google"], button:has-text("Google"), a:has-text("Google")');
    const count = await googleButton.count();

    expect(count).toBeGreaterThan(0);
  });
});
