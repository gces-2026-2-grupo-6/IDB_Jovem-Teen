import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US14 — Evento cancelado ou adiado, nas telas públicas.
 *
 * O evento marcado **continua aparecendo**: o que muda é que um aviso informa
 * a situação e os botões de inscrição somem enquanto ela durar. Esconder o
 * evento tiraria do visitante justamente o aviso que a história quer dar.
 */

/* Marca o evento do mock antes de abrir a tela pública.

   A marcação passa pelo serviço real e pela rota `PATCH /evento/{id}/situacao`
   do mock, cujo estado vive enquanto a página existir — então basta navegar
   para a tela pública em seguida. */
async function marcarEvento(page, { situacao, novaData = null }) {
  await page.goto('/');
  await page.evaluate(
    async ({ situacao, novaData }) => {
      const mod = await import('/src/services/eventService.js');
      const r = await mod.handleAlterarSituacaoEvento(1, situacao, novaData);
      if (!r.success) throw new Error(r.error);
    },
    { situacao, novaData }
  );
}

test.describe('US14 - Página do evento', () => {
  test('CA2: evento cancelado mostra o aviso', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByRole('status').filter({ hasText: 'Evento cancelado' })).toBeVisible();
  });

  test('CA4: evento adiado com nova data mostra a data', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'adiado', novaData: '2027-04-10T09:00' });

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByText('Adiado para 10/04/2027')).toBeVisible();
  });

  test('CA4: evento adiado sem nova data avisa que ela vem depois', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'adiado' });

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByText('Evento adiado — nova data em breve')).toBeVisible();
  });

  test('CA4: os botões de inscrição somem enquanto durar a situação', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/eventos/1-retiro-de-verao');

    /* O evento 1 abre os dois fluxos quando está ativo (US09). */
    await expect(page.getByRole('button', { name: 'Inscreva-se' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Seja Voluntário' })).toHaveCount(0);
  });

  test('evento ativo segue com os botões e sem aviso', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByRole('button', { name: 'Inscreva-se' })).toBeVisible();
    await expect(page.getByText('Evento cancelado')).toHaveCount(0);
  });
});

test.describe('US14 - Agenda de eventos', () => {
  test('CA4: o evento continua na lista, com aviso e sem inscrição', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/eventos');

    const grid = page.locator('section.pb-20 > div > div.grid');
    const card = grid.locator('> div').filter({ hasText: 'Retiro de Verão' }).first();

    /* Não filtre o evento marcado: ele precisa ser encontrado. */
    await expect(card).toBeVisible();
    await expect(card.getByText('Evento cancelado')).toBeVisible();
    await expect(card.getByText('Cancelado', { exact: true })).toBeVisible();

    await expect(card.getByRole('button', { name: 'Inscreva-se' })).toHaveCount(0);
    await expect(card.getByRole('button', { name: 'Seja Voluntário' })).toHaveCount(0);

    /* "Veja mais" fica: é lá que o visitante entende o que aconteceu. */
    await expect(card.getByRole('link', { name: /Veja mais/ })).toBeVisible();
  });

  test('o adiado mostra a nova data no card', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'adiado', novaData: '2027-04-10T09:00' });

    await page.goto('/eventos');

    const grid = page.locator('section.pb-20 > div > div.grid');
    const card = grid.locator('> div').filter({ hasText: 'Retiro de Verão' }).first();

    await expect(card.getByText('Adiado para 10/04/2027')).toBeVisible();
  });
});

test.describe('US14 - Página inicial', () => {
  test('CA2: o calendário da home mostra a situação', async ({ page }) => {
    await setupApiMock(page);
    await marcarEvento(page, { situacao: 'cancelado' });

    await page.goto('/');

    const calendario = page.locator('section').filter({ hasText: 'Calendário de Eventos' });
    await expect(
      calendario.getByText('Evento cancelado').first()
    ).toBeVisible();
  });
});
