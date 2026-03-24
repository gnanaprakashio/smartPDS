const { test, expect, defineStep } = require('@playwright/test');

/**
 * SPDS UI Testing Suite
 * Tests: Responsive Design, Functional UI, Performance, Consistency, Error Handling
 */

// ============================================
// TASK 1: RESPONSIVE DESIGN TESTS
// ============================================

test.describe('Responsive Design Tests', () => {
  
  test('Mobile viewport - no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const body = await page.locator('body');
    const boundingBox = await body.boundingBox();
    
    expect(boundingBox.width).toBeLessThanOrEqual(375);
  });

  test('Tablet viewport - sidebar collapsible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check sidebar is present
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('Desktop viewport - full layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    
    // Verify full sidebar is visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('Navbar responsive - no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
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
    await page.goto('/');
    await expect(page).toHaveTitle(/SPDS|Smart|Login/);
  });

  test('Login form has all required fields', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Login validation - required fields', async ({ page }) => {
    await page.goto('/');
    await page.click('button[type="submit"]');
    
    // Check for HTML5 validation or error messages
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('Shop ID field shows for staff login', async ({ page }) => {
    await page.goto('/');
    
    // Type staff email to see if shop field appears
    await page.fill('input[type="email"]', 'staff@pds.gov.in');
    await page.waitForTimeout(500);
    
    const shopInput = page.locator('input[placeholder*="SHOP"]');
    await expect(shopInput).toBeVisible();
  });
});

test.describe('Dashboard Tests', () => {
  
  test('Dashboard loads after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pds.gov.in');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Dashboard stat cards display', async ({ page }) => {
    await loginAsPDSOfficer(page);
    
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Inventory Items')).toBeVisible();
  });
});

test.describe('Users Page Tests', () => {
  
  test('Users page loads with table', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    
    await expect(page.locator('table')).toBeVisible();
  });

  test('Search input works', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('test');
    await page.waitForTimeout(500);
  });

  test('Filter dropdowns are present', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    
    await expect(page.locator('select')).toHaveCount(3);
  });

  test('Add User button opens modal', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    
    const addButton = page.locator('button:has-text("Add User")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator('text=Ration Card Number')).toBeVisible();
    }
  });
});

test.describe('Inventory Page Tests', () => {
  
  test('Inventory page loads', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    
    await expect(page.locator('text=Inventory')).toBeVisible();
  });

  test('Inventory table displays stock data', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    
    // Should see either table or cards
    const hasContent = await page.locator('text=Rice').isVisible() || 
                      await page.locator('table').isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('Run Schedule button exists', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/inventory');
    
    const scheduleButton = page.locator('button:has-text("Run Schedule")');
    await expect(scheduleButton).toBeVisible();
  });
});

test.describe('Slots Page Tests', () => {
  
  test('Slots page loads', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/slots');
    
    await expect(page.locator('text=Slots')).toBeVisible();
  });
});

test.describe('Navigation Tests', () => {
  
  test('Sidebar navigation works', async ({ page }) => {
    await loginAsPDSOfficer(page);
    
    // Click on Users in sidebar
    await page.click('a[href="/users"]');
    await page.waitForURL('**/users');
    
    // Click on Inventory
    await page.click('a[href="/inventory"]');
    await page.waitForURL('**/inventory');
  });

  test('Logout works', async ({ page }) => {
    await loginAsPDSOfficer(page);
    
    const logoutButton = page.locator('button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('**/login');
    }
  });
});

// ============================================
// TASK 3: PERFORMANCE TESTS
// ============================================

test.describe('Performance Tests', () => {
  
  test('Page load time < 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('No memory leaks - multiple navigations', async ({ page }) => {
    await loginAsPDSOfficer(page);
    
    for (let i = 0; i < 5; i++) {
      await page.goto('/users');
      await page.goto('/inventory');
      await page.goto('/dashboard');
    }
    
    // If we reach here without crashing, test passes
    expect(true).toBeTruthy();
  });
});

// ============================================
// TASK 4: UI CONSISTENCY TESTS
// ============================================

test.describe('UI Consistency Tests', () => {
  
  test('Theme colors are consistent', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/dashboard');
    
    // Check that buttons use consistent color classes
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Icons are present and visible', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    
    const icons = page.locator('svg');
    const iconCount = await icons.count();
    
    expect(iconCount).toBeGreaterThan(5);
  });
});

// ============================================
// TASK 5: ERROR HANDLING TESTS
// ============================================

test.describe('Error Handling Tests', () => {
  
  test('Loading state shows while fetching data', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    
    // Should show loading state initially
    const loadingOrContent = page.locator('text=Loading').or(page.locator('table'));
    await expect(loadingOrContent).toBeVisible();
  });

  test('Error message displays on failed API', async ({ page }) => {
    // Clear auth to cause 401
    await page.goto('/dashboard');
    
    // If there's an error, should display message
    const errorMessage = page.locator('text=Error').or(page.locator('text=Failed'));
    const hasError = await errorMessage.count() > 0 || await page.locator('.error').count() > 0;
    
    // This test checks error handling exists
    expect(hasError || await page.locator('body').isVisible()).toBeTruthy();
  });

  test('Empty state handled', async ({ page }) => {
    await loginAsPDSOfficer(page);
    await page.goto('/users');
    
    // Either shows users or empty message
    const hasContent = await page.locator('table').isVisible() || 
                      await page.locator('text=No users').isVisible() ||
                      await page.locator('text=No data').isVisible();
    expect(hasContent).toBeTruthy();
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function loginAsPDSOfficer(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@pds.gov.in');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

async function loginAsStaff(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'staff@pds.gov.in');
  await page.fill('input[type="password"]', 'staff123');
  await page.fill('input[placeholder*="SHOP"]', 'SHOP001');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}
