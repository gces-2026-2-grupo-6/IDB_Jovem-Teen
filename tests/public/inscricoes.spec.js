import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US09 — páginas públicas: cada fluxo de inscrição tem o seu próprio botão.
 *
 * Antes havia um só formulário por evento, e "Inscreva-se" abria justamente o
 * de voluntariado — que é outra coisa. Agora "Inscreva-se" é a inscrição de
 * participante e "Seja Voluntário" é a de voluntário.
 *
 * No mock: o evento 1 abre os dois fluxos, o evento 2 não abre nenhum.
 */

/* Guarda o que o site mandaria abrir em nova aba, para conferir qual dos dois
   formulários cada botão aponta. */
async function capturarAberturas(page) {
  await page.addInitScript(() => {
    window.__aberturas = [];
    window.open = (url) => {
      window.__aberturas.push(url);
      return null;
    };
  });
  return () => page.evaluate(() => window.__aberturas);
}

test.describe('US09 - Página do evento: botão por fluxo', () => {
  test('deve oferecer os dois botões quando o evento abre os dois fluxos', async ({ page }) => {
    await setupApiMock(page);
    const aberturas = await capturarAberturas(page);

    await page.goto('/eventos/1-retiro-de-verao');

    await expect(page.getByRole('button', { name: 'Inscreva-se' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seja Voluntário' })).toBeVisible();

    await page.getByRole('button', { name: 'Inscreva-se' }).click();
    await page.getByRole('button', { name: 'Seja Voluntário' }).click();

    expect(await aberturas()).toEqual([
      'https://forms.gle/retiro-participantes',
      'https://forms.gle/retiro',
    ]);
  });

  test('não deve oferecer botão de um fluxo que o evento não abriu', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/eventos/2-acampamento');

    await expect(page.getByRole('heading', { name: 'Acampamento Jovem' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inscreva-se' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Seja Voluntário' })).toHaveCount(0);
  });
});

test.describe('US09 - Listagem de eventos: botão por fluxo', () => {
  test('o card leva "Inscreva-se" ao formulário de participantes', async ({ page }) => {
    await setupApiMock(page);
    const aberturas = await capturarAberturas(page);

    await page.goto('/eventos');

    const grid = page.locator('section.pb-20 > div > div.grid');
    const card = grid.locator('> div').filter({ hasText: 'Retiro de Verão' }).first();

    await card.getByRole('button', { name: 'Inscreva-se' }).click();

    expect(await aberturas()).toEqual(['https://forms.gle/retiro-participantes']);
  });

  test('o card só mostra "Seja Voluntário" no evento que abriu esse fluxo', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/eventos');

    const grid = page.locator('section.pb-20 > div > div.grid');

    const comVoluntariado = grid.locator('> div').filter({ hasText: 'Retiro de Verão' }).first();
    await expect(comVoluntariado.getByRole('button', { name: 'Seja Voluntário' })).toBeVisible();

    const semVoluntariado = grid.locator('> div').filter({ hasText: 'Acampamento Jovem' }).first();
    await expect(semVoluntariado.getByRole('button', { name: 'Seja Voluntário' })).toHaveCount(0);
  });
});
