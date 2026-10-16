import { expect, test } from '@playwright/test';
import { e2eCredentials, signIn } from './helpers/auth';

test.describe('auth', () => {
  test('signs in with email and password and reaches /app', async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole('link', { name: 'Áreas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Horizontes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Preferências' })).toBeVisible();
  });

  test('rejects a wrong password with a generic message', async ({ page }) => {
    const { email } = e2eCredentials();
    await page.goto('/signin');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha').fill('senha-errada-e2e');
    await page.getByRole('button', { name: 'Entrar com e-mail' }).click();
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });
});
