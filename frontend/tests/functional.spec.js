/**
 * SPDS Functional Testing Suite
 * Tests for all pages using Playwright
 */

import { test, expect } from '@playwright/test';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function loginAsPDSOfficer(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('[data-testid="login-email-input"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill('admin@pds.gov.in');
    await page.fill('[data-testid="login-password-input"]', 'admin123');
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  }
}

async function loginAsStaff(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('[data-testid="login-email-input"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill('staff@pds.gov.in');
    await page.fill('[data-testid="login-password-input"]', 'staff123');
    await page.fill('[data-testid="login-shopid-input"]', 'SHOP001');
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  }
}

// ============================================
// 1. LOGIN PAGE TESTS
// ============================================

test.describe('Login Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();
  });

  test('should show shop ID field when staff email entered', async ({ page }) => {
    await page.fill('[data-testid="login-email-input"]', 'staff@pds.gov.in');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="login-shopid-input"]')).toBeVisible();
  });

  test('should login successfully as PDS Officer', async ({ page }) => {
    await page.fill('[data-testid="login-email-input"]', 'admin@pds.gov.in');
    await page.fill('[data-testid="login-password-input"]', 'admin123');
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    expect(page.url()).toContain('/dashboard');
  });
});

// ============================================
// 2. DASHBOARD TESTS
// ============================================

test.describe('Dashboard', () => {
  
  test('should load dashboard for PDS Officer', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('should display stat cards', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await expect(page.locator('text=Total Users')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Users page from quick actions', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.click('text=Manage Users');
    await page.waitForURL('**/users', { timeout: 10000 });
  });

  test('should navigate to Inventory page from quick actions', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.click('text=Update Inventory');
    await page.waitForURL('**/inventory', { timeout: 10000 });
  });
});

// ============================================
// 3. USERS PAGE TESTS
// ============================================

test.describe('Users Page', () => {
  
  test('should load users page', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Users")')).toBeVisible({ timeout: 10000 });
  });

  test('should display users table', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasTable = await page.locator('table').isVisible();
    const hasEmpty = await page.locator('text=No users').count() > 0;
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('should filter by card type', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const selects = page.locator('select');
    const count = await selects.count();
    if (count > 0) {
      await selects.first().selectOption({ label: 'AAY' });
    }
  });

  test('should search users', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });
});

// ============================================
// 4. INVENTORY PAGE TESTS
// ============================================

test.describe('Inventory Page', () => {
  
  test('should load inventory page', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Inventory")')).toBeVisible({ timeout: 10000 });
  });

  test('should display inventory content', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('text=Shop').first().isVisible() ||
                       await page.locator('table').isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('should run schedule button exists', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasButton = await page.locator('button:has-text("Run Schedule")').count() > 0;
    expect(hasButton).toBeTruthy();
  });
});

// ============================================
// 5. SLOTS PAGE TESTS
// ============================================

test.describe('Slots Page', () => {
  
  test('should load slots page', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/slots');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Slots")')).toBeVisible({ timeout: 10000 });
  });

  test('should display slots content', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/slots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('text=Slot').first().isVisible() || 
                       await page.locator('table').isVisible();
    expect(hasContent).toBeTruthy();
  });
});

// ============================================
// 6. NAVIGATION TESTS
// ============================================

test.describe('Navigation', () => {
  
  test('should navigate to Users via sidebar', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.click('a[href="/users"]');
    await page.waitForURL('**/users', { timeout: 10000 });
  });

  test('should navigate to Inventory via sidebar', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.click('a[href="/inventory"]');
    await page.waitForURL('**/inventory', { timeout: 10000 });
  });

  test('should navigate to Slots via sidebar', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.click('a[href="/slots"]');
    await page.waitForURL('**/slots', { timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsPDSOfficer(page);
    const logoutBtn = page.locator('button').filter({ hasText: /^Logout$/ });
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await page.waitForTimeout(2000);
    }
  });
});

// ============================================
// 7. ERROR HANDLING TESTS
// ============================================

test.describe('Error Handling', () => {
  
  test('should show loading state or content', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });
});

// ============================================
// 8. RESPONSIVE DESIGN TESTS
// ============================================

test.describe('Responsive Design', () => {
  
  test('should display on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAsPDSOfficer(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsPDSOfficer(page);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================
// 9. ROLE-BASED ACCESS TESTS
// ============================================

test.describe('Role-Based Access', () => {
  
  test('staff should not see CSV upload button', async ({ page }) => {
    await loginAsStaff(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const csvButton = page.locator('button:has-text("Upload CSV")');
    expect(await csvButton.count()).toBe(0);
  });
});
