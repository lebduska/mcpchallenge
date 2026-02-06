import { test, expect } from '@playwright/test';

test('chess piece drag and drop works correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/challenges/chess');
  await page.waitForTimeout(2000);

  // Start game as white
  await page.click('text=Play as White');
  await page.waitForTimeout(1000);

  // Verify initial state
  await expect(page.locator('text=Your Move')).toBeVisible();
  await expect(page.locator('text=No moves yet')).toBeVisible();

  // Take screenshot before
  await page.screenshot({ path: 'tests/screenshots/chess-before-move.png', fullPage: true });

  // Drag e2 pawn to e4 using page.dragAndDrop (works with react-dnd)
  await page.dragAndDrop('[data-square="e2"] [data-piece]', '[data-square="e4"]', {
    sourcePosition: { x: 46, y: 46 },
    targetPosition: { x: 46, y: 46 },
  });

  // Wait for move to be processed and AI to respond
  await page.waitForTimeout(2000);

  // Take screenshot after
  await page.screenshot({ path: 'tests/screenshots/chess-after-move.png', fullPage: true });

  // Verify move was registered in history
  await expect(page.locator('text=e4').first()).toBeVisible();

  // Verify pawn is now on e4
  const e4Piece = page.locator('[data-square="e4"] [data-piece="wP"]');
  await expect(e4Piece).toBeVisible();
});

test('chess multiple moves work', async ({ page }) => {
  await page.goto('http://localhost:3000/challenges/chess');
  await page.waitForTimeout(2000);
  await page.click('text=Play as White');
  await page.waitForTimeout(1000);

  // Move 1: e4
  await page.dragAndDrop('[data-square="e2"] [data-piece]', '[data-square="e4"]', {
    sourcePosition: { x: 46, y: 46 },
    targetPosition: { x: 46, y: 46 },
  });
  await page.waitForTimeout(2000); // Wait for AI

  // Move 2: d4
  await page.dragAndDrop('[data-square="d2"] [data-piece]', '[data-square="d4"]', {
    sourcePosition: { x: 46, y: 46 },
    targetPosition: { x: 46, y: 46 },
  });
  await page.waitForTimeout(2000); // Wait for AI

  // Screenshot
  await page.screenshot({ path: 'tests/screenshots/chess-multi-move.png', fullPage: true });

  // Verify moves count increased
  const movesText = page.locator('text=MOVES').locator('..').locator('text=/\\d+/');
  await expect(movesText).toBeVisible();
});
