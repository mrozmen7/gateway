import { expect, test } from '@playwright/test';

test('client can sign in, view accounts, and open transfer flow', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('elena.brunner@helvetiq.example');
  await page.getByLabel('Password').fill('gateway!');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByRole('heading', { name: /enter your code/i })).toBeVisible();
  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: /verify/i }).click();

  await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible();
  await expect(page.getByText(/total net position/i)).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: /move money/i }).click();
  await expect(page.getByRole('heading', { name: /move money/i })).toBeVisible();
  await expect(page.getByText(/transfer studio/i)).toBeVisible();
});

test('operator can inspect platform health', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('ops@helvetiq.example');
  await page.getByLabel('Password').fill('OpsPass123');
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByRole('heading', { name: /platform health/i })).toBeVisible();
  await expect(page.getByText(/api-gateway/i)).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: /transaction inspector/i })).toBeVisible();
});
