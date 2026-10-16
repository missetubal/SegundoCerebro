import { expect, test } from '@playwright/test';
import { signIn } from './helpers/auth';

test.describe('areas', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('creates, archives and shows the area under Arquivados', async ({
    page,
  }) => {
    const name = `E2E Área ${Date.now()}`;

    await page.goto('/app/areas/new');
    await page.getByLabel('Nome').fill(name);
    await page.getByRole('radio', { name: 'Azul' }).click({ force: true });
    await page.getByRole('radio', { name: 'Coração' }).click({ force: true });
    await page.getByRole('button', { name: 'Criar área' }).click();

    await expect(page).toHaveURL(/\/app\/areas\/[^/]+$/);
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Arquivar' }).click();
    await expect(page.getByRole('button', { name: 'Desarquivar' })).toBeVisible();

    await page.goto('/app/areas');
    await page.getByText(/Arquivados/).click();
    await expect(
      page.getByRole('button', { name: `Desarquivar ${name}` }),
    ).toBeVisible();
  });
});

