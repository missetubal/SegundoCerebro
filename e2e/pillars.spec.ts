import { expect, test } from '@playwright/test';
import { signIn } from './helpers/auth';

test.describe('pillars', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('creates, archives and shows the pillar under Arquivados', async ({
    page,
  }) => {
    const name = `E2E Pilar ${Date.now()}`;

    await page.goto('/app/pillars/new');
    await page.getByLabel('Nome').fill(name);
    await page.getByRole('radio', { name: 'Azul' }).click({ force: true });
    await page.getByRole('radio', { name: 'Coração' }).click({ force: true });
    await page.getByRole('button', { name: 'Criar pilar' }).click();

    await expect(page).toHaveURL(/\/app\/pillars\/[^/]+$/);
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Arquivar' }).click();
    await expect(page.getByRole('button', { name: 'Desarquivar' })).toBeVisible();

    await page.goto('/app/pillars');
    await page.getByText(/Arquivados/).click();
    await expect(
      page.getByRole('button', { name: `Desarquivar ${name}` }),
    ).toBeVisible();
  });
});

