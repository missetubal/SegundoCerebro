import { expect, type Page, test } from '@playwright/test';

async function saveCheckIn(page: Page) {
  const submitted = page.waitForResponse(
    (response) =>
      response.url().includes('/app/check-in') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  expect((await submitted).ok()).toBeTruthy();
  await expect(page.getByRole('button', { name: 'Salvar', exact: true })).toBeEnabled();
  await expect(page.locator('main [role="alert"]')).toHaveCount(0);
}

test.describe('medications', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) {
      throw new Error('E2E_EMAIL and E2E_PASSWORD are required.');
    }
    await page.goto('/signin', { waitUntil: 'domcontentloaded' });
    const emailField = page.getByLabel('E-mail');
    const passwordField = page.getByLabel('Senha');
    await expect(async () => {
      await emailField.fill(email);
      await passwordField.fill(password);
      await expect(emailField).toHaveValue(email);
      await expect(passwordField).toHaveValue(password);
    }).toPass();
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/app(?:\/|$)/);
  });

  test('registers a medication, marks today, and clears it without a dose field', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const name = `Losartana ${Date.now()}`;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app/medications/new');
    await expect(page.locator('input[name="dose"], input[name="doseAmount"]')).toHaveCount(0);
    await page.getByLabel('Nome').fill(name);
    await page.getByLabel('Horário 1').fill('08:00');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page).toHaveURL(/\/app\/medications$/);
    const row = page.locator('li').filter({ hasText: name });
    await expect(row).toContainText('08:00');
    await page.reload();
    await expect(row).toContainText('08:00');

    await page.getByRole('link', { name: `Editar ${name}` }).click();
    await page.getByLabel('Horário 1').fill('09:00');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/app\/medications$/);
    await expect(row).toContainText('09:00');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/app/check-in');
    await expect(page.getByRole('heading', { name: name })).toBeVisible();
    await expect(page.getByText('Organização sua.')).toBeVisible();
    const card = page.locator('article').filter({ hasText: name });
    await card.getByRole('button', { name: 'Realizado', exact: true }).click();
    await expect(
      card.getByRole('button', { name: 'Realizado', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(card.locator('input[type="hidden"]')).toHaveValue('done');
    await saveCheckIn(page);

    await page.reload();
    const reloaded = page.locator('article').filter({ hasText: name });
    await expect(
      reloaded.getByRole('button', { name: 'Realizado', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');

    await reloaded.getByRole('button', { name: 'Pendente', exact: true }).click();
    await expect(reloaded.locator('input[type="hidden"]')).toHaveValue('pending');
    await saveCheckIn(page);
    await page.reload();
    await expect(
      page
        .locator('article')
        .filter({ hasText: name })
        .getByRole('button', { name: 'Pendente', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');

    await page.getByLabel('Nota do dia').fill('Só a nota');
    await saveCheckIn(page);
    await expect(page.getByLabel('Nota do dia')).toHaveValue('Só a nota');

    await page.goto('/app/medications');
    await page.getByRole('button', { name: `Arquivar ${name}` }).click();
    await page.getByText(/Arquivados/).click();
    await expect(page.getByRole('button', { name: `Reativar ${name}` })).toBeVisible();
  });
});
