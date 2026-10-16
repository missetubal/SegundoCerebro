import { expect, test } from '@playwright/test';
import { signIn } from './helpers/auth';

test.describe('horizons', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('lists defaults, creates a horizon and moves it up', async ({ page }) => {
    const name = `E2E Horizonte ${Date.now()}`;

    await page.goto('/app/horizons');
    await expect(page.getByRole('heading', { name: 'Horizontes' })).toBeVisible();

    for (const label of ['Curto', 'Médio', 'Longo', 'Contínuo']) {
      await expect(page.locator(`input[name="name"][value="${label}"]`)).toBeVisible();
    }

    await page.getByLabel('Novo horizonte').fill(name);
    await page.getByRole('button', { name: 'Adicionar' }).click();
    await expect(page.locator(`input[name="name"][value="${name}"]`)).toBeVisible();

    await page.getByRole('button', { name: `Mover ${name} para cima` }).click();
    await expect(
      page.getByRole('button', { name: `Mover ${name} para baixo` }),
    ).toBeEnabled();
  });
});
