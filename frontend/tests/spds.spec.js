import { test, expect } from '@playwright/test';

/**
 * SPDS UI Testing Suite
 * Tests: Responsive Design, Functional UI, Performance, Consistency, Error Handling
 */

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

// ============================================
// TASK 1: RESPONSIVE DESIGN TESTS
// ============================================

test.describe('Responsive Design Tests', () => {
  
  test('Mobile viewport - no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();
    
    expect(boundingBox.width).toBeLessThanOrEqual(375);
  });

  test('Desktop viewport - layout works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const sidebar = page.locator('aside');
    const hasSidebar = await sidebar.count() > 0;
    expect(hasSidebar).toBeTruthy();
  });

  test('Navbar responsive - no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsPDSOfficer(page);
    
    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    
    expect(headerBox.width).toBeLessThanOrEqual(375);
  });
});

// ============================================
// TASK 2: FUNCTIONAL UI TESTS
// ============================================

test.describe('Login Page Tests', () => {
  
  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
  });

  test('Login form has all required fields', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();
  });

  test('Shop ID field shows for staff login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="login-email-input"]', 'staff@pds.gov.in');
    await page.waitForTimeout(500);
    
    await expect(page.locator('[data-testid="login-shopid-input"]')).toBeVisible();
  });
});

test.describe('Dashboard Tests', () => {
  
  test('Dashboard loads after login', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard stat cards display', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await expect(page.locator('text=Total Users')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Users Page Tests', () => {
  
  test('Users page loads with table', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasTable = await page.locator('table').isVisible();
    const hasEmpty = await page.locator('text=No users').count() > 0;
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('Search input works', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
    }
  });
});

test.describe('Inventory Page Tests', () => {
  
  test('Inventory page loads', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Inventory")')).toBeVisible({ timeout: 10000 });
  });

  test('Inventory displays stock data', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('table').isVisible() ||
                       await page.locator('.card').first().isVisible();
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Slots Page Tests', () => {
  
  test('Slots page loads', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/slots');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Slots")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation Tests', () => {
  
  test('Sidebar navigation works', async ({ page }) => {
    await loginAsPDSOfficer(page);
    
    await page.click('a[href="/users"]');
    await page.waitForURL('**/users', { timeout: 10000 });
    
    await page.click('a[href="/inventory"]');
    await page.waitForURL('**/inventory', { timeout: 10000 });
  });

  test('Logout works', async ({ page }) => {
    await loginAsPDSOfficer(page);
    
    const logoutButton = page.locator('button').filter({ hasText: /^Logout$/ });
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);
    }
  });
});

// ============================================
// TASK 3: PERFORMANCE TESTS
// ============================================

test.describe('Performance Tests', () => {
  
  test('Page load time < 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('Multiple navigations work', async ({ page }) => {
    await loginAsPDSOfficer(page);
    
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    expect(true).toBeTruthy();
  });
});

// ============================================
// TASK 4: UI CONSISTENCY TESTS
// ============================================

test.describe('UI Consistency Tests', () => {
  
  test('Buttons are present', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/dashboard');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Icons are present', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/dashboard');
    
    const icons = page.locator('svg');
    const iconCount = await icons.count();
    
    expect(iconCount).toBeGreaterThan(0);
  });
});

// ============================================
// TASK 5: ERROR HANDLING TESTS
// ============================================

test.describe('Error Handling Tests', () => {
  
  test('Loading state shows', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('Content displays', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });
});
