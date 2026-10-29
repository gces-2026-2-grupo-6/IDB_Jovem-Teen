import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';
import { loginAsAdmin, loginComPapeis } from '../helpers/adminAuth';

/* US14 — Marcar evento como cancelado ou adiado, no painel.
 *
 * Nada é apagado: evento, inscrições e fotos continuam guardados, e o site
 * não avisa ninguém. A marcação é uma ação isolada, salva sozinha, sem passar
 * pelo formulário do evento.
 */

test.describe('US14 - Marcação no painel', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);
  });

  test('CA1: marca o evento como cancelado', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    await expect(page.getByRole('heading', { name: 'Situação do evento' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancelado' }).click();

    const patch = page.waitForRequest(
      (r) => r.url().includes('/evento/1/situacao') && r.method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    expect((await patch).postDataJSON()).toMatchObject({ situacao: 'cancelado', nova_data: null });

    await expect(page.getByText(/Situação salva/)).toBeVisible();
  });

  test('CA1: marca como adiado com a nova data', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    await page.getByRole('button', { name: 'Adiado' }).click();
    await page.getByLabel('Nova data (opcional)').fill('2027-04-10T09:00');

    const patch = page.waitForRequest(
      (r) => r.url().includes('/evento/1/situacao') && r.method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    expect((await patch).postDataJSON()).toMatchObject({
      situacao: 'adiado',
      nova_data: '2027-04-10T09:00:00',
    });
  });

  test('adiado sem nova data é aceito: nem sempre ela já existe', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    await page.getByRole('button', { name: 'Adiado' }).click();

    const patch = page.waitForRequest(
      (r) => r.url().includes('/evento/1/situacao') && r.method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    expect((await patch).postDataJSON()).toMatchObject({ situacao: 'adiado', nova_data: null });
  });

  test('CA1: desfaz a marcação voltando para ativo', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    await page.getByRole('button', { name: 'Cancelado' }).click();
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    await expect(page.getByText(/Situação salva/)).toBeVisible();

    await page.getByRole('button', { name: 'Ativo' }).click();
    const patch = page.waitForRequest(
      (r) => r.url().includes('/evento/1/situacao') && r.method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    expect((await patch).postDataJSON()).toMatchObject({ situacao: 'ativo' });

    await expect(page.getByText(/Marcação desfeita/)).toBeVisible();
  });

  test('a nova data só é pedida no adiado', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    await expect(page.getByLabel('Nova data (opcional)')).toHaveCount(0);

    await page.getByRole('button', { name: 'Adiado' }).click();
    await expect(page.getByLabel('Nova data (opcional)')).toBeVisible();

    await page.getByRole('button', { name: 'Cancelado' }).click();
    await expect(page.getByLabel('Nova data (opcional)')).toHaveCount(0);
  });

  test('sem mudança, não há o que salvar', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');

    await expect(page.getByRole('button', { name: 'Atualizar situação' })).toBeDisabled();

    await page.getByRole('button', { name: 'Cancelado' }).click();
    await expect(page.getByRole('button', { name: 'Atualizar situação' })).toBeEnabled();
  });

  test('a lista do painel mostra o que já está marcado', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Cancelado' }).click();
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    await expect(page.getByText(/Situação salva/)).toBeVisible();

    await page.goto('/admin/eventos');
    await expect(page.getByText('Cancelado', { exact: true })).toBeVisible();
  });

  test('CA3: marcar não apaga nada — o evento segue editável e na lista', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Cancelado' }).click();
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    await expect(page.getByText(/Situação salva/)).toBeVisible();

    await page.goto('/admin/eventos');
    await expect(page.getByText('Retiro de Verão')).toBeVisible();
  });

  test('editar o evento pelo formulário preserva o adiamento', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Adiado' }).click();
    await page.getByLabel('Nova data (opcional)').fill('2027-04-10T09:00');
    await page.getByRole('button', { name: 'Atualizar situação' }).click();
    await expect(page.getByText(/Situação salva/)).toBeVisible();

    /* O formulário completo não envia `situacao`: o back-end só sobrescreve o
       que recebe, então a marcação sobrevive à edição.

       O tipo é obrigatório e o evento do mock não tem um, então escolher um
       aqui é o que torna o formulário enviável — sem isso o navegador barra o
       envio e o teste não chegaria a exercitar a regra. */
    await page.locator('select[name="tipoEvento"]').selectOption('Conferência');

    const put = page.waitForRequest(
      (r) => r.url().includes('/evento/1') && r.method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    expect((await put).postDataJSON()).not.toHaveProperty('situacao');

    await page.goto('/eventos/1-retiro-de-verao');
    await expect(page.getByText('Adiado para 10/04/2027')).toBeVisible();
  });

  test('falha do servidor é explicada, sem perder a escolha', async ({ page }) => {
    await page.route(/\/evento\/1\/situacao$/, (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'sem permissão' }),
      })
    );

    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Cancelado' }).click();
    await page.getByRole('button', { name: 'Atualizar situação' }).click();

    await expect(
      page.getByText(/Apenas o setor de eventos ou a superadministradora/)
    ).toBeVisible();
  });
});

test.describe('US14 - CA1: quem pode marcar', () => {
  test('o administrador do setor de eventos alcança a tela', async ({ page }) => {
    await setupApiMock(page);
    await loginComPapeis(page, ['admin', 'admin-eventos']);

    await page.goto('/admin/eventos/1/editar');

    await expect(page.getByRole('heading', { name: 'Situação do evento' })).toBeVisible();
  });
});
