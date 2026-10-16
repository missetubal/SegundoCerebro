import { expect, type Page } from '@playwright/test';

export function e2eCredentials() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'E2E_EMAIL and E2E_PASSWORD are required. Copy them into .env.e2e (see .env.example).',
    );
  }
  return { email, password };
}

export async function signIn(page: Page) {
  const { email, password } = e2eCredentials();
  await page.goto('/signin');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar com e-mail' }).click();
  await expect(page).toHaveURL(/\/app(?:\/|$)/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
