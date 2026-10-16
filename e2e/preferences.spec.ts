import { expect, test } from '@playwright/test';
import { signIn } from './helpers/auth';

test.describe('preferences', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('saves a timezone from the select', async ({ page }) => {
    await page.goto('/app/preferences');
    await expect(page.getByRole('heading', { name: 'Preferências' })).toBeVisible();

    const select = page.getByLabel('Fuso horário');
    await expect(select).toBeVisible();

    const current = await select.inputValue();
    const next = current === 'Europe/Lisbon' ? 'America/Sao_Paulo' : 'Europe/Lisbon';
    await select.selectOption(next);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Fuso horário salvo.')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Fuso horário')).toHaveValue(next);
  });
});
