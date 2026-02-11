import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Work Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /continue to dashboard/i }).click();
}

test('admin can log in and save platform settings', async ({ page }) => {
  await login(page, 'admin@voicenexus.ai', 'admin123');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Platform Settings' })).toBeVisible();

  const actor = `e2e-admin-${Date.now()}`;
  const reason = `e2e validation ${Date.now()}`;
  await page.getByLabel('Audit Actor').fill(actor);
  await page.getByLabel('Allow auto-retry on failed calls').click();
  await page.getByLabel('Change Reason (optional)').fill(reason);

  const saveButton = page.getByRole('button', { name: 'Save Changes' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(page.getByText('Platform settings saved successfully.')).toBeVisible();
  await expect(page.getByText(actor)).toBeVisible();
});

test('viewer is read-only on platform settings', async ({ page }) => {
  await login(page, 'viewer@voicenexus.ai', 'viewer123');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/settings');

  await expect(page.getByText('You are signed in as viewer. Settings are read-only.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
});
