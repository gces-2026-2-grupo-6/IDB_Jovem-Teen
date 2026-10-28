import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US22 (site público): missão, visão e valores numa página própria, com
   navegação clara a partir da página inicial. O conteúdo vem do painel; sem
   nada salvo, o site mostra só a missão que já estava publicada no rodapé. */

const MISSAO_PUBLICADA = /Inspirar e capacitar as novas gerações/;

const CONTEUDO = {
  missao: 'Levar cada jovem a viver a fé com propósito.',
  visao: 'Ser referência nacional para a juventude da igreja.',
  valores: ['Fé', 'Comunhão', 'Serviço'],
};

async function comConteudoSalvo(page, conteudo = CONTEUDO) {
  await page.route(/^https?:\/\/[^/]+\/institucional\/?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(conteudo) });
  });
}

test.describe('US22 - Página "Quem somos"', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('sem conteúdo salvo, mostra só a missão já publicada', async ({ page }) => {
    await page.goto('/quem-somos');

    await expect(page.getByRole('heading', { name: 'Missão' })).toBeVisible();
    await expect(page.locator('main').getByText(MISSAO_PUBLICADA)).toBeVisible();
    /* Nada de visão ou valores inventados. */
    await expect(page.getByRole('heading', { name: 'Visão' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Valores' })).toHaveCount(0);
  });

  test('se a leitura falhar, também cai na missão publicada', async ({ page }) => {
    await page.route(/^https?:\/\/[^/]+\/institucional\/?$/, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"erro"}' })
    );
    await page.goto('/quem-somos');

    await expect(page.locator('main').getByText(MISSAO_PUBLICADA)).toBeVisible();
  });

  test('com conteúdo salvo, mostra missão, visão e a lista de valores', async ({ page }) => {
    await comConteudoSalvo(page);
    await page.goto('/quem-somos');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Quem');
    await expect(page.getByRole('region', { name: 'Missão' })).toContainText(CONTEUDO.missao);
    await expect(page.getByRole('region', { name: 'Visão' })).toContainText(CONTEUDO.visao);
    const valores = page.getByRole('region', { name: 'Valores' }).getByRole('listitem');
    await expect(valores).toHaveText([/Fé$/, /Comunhão$/, /Serviço$/]);
  });

  test('bloco sem conteúdo não aparece', async ({ page }) => {
    await comConteudoSalvo(page, { missao: 'Só a missão.', visao: null, valores: [] });
    await page.goto('/quem-somos');

    await expect(page.getByRole('region', { name: 'Missão' })).toContainText('Só a missão.');
    await expect(page.getByRole('region', { name: 'Visão' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Valores' })).toHaveCount(0);
  });

  test('"Saiba mais" da página inicial leva à página', async ({ page }) => {
    await page.goto('/');
    const secaoSobre = page.locator('section').filter({ has: page.getByRole('heading', { name: /CONHEÇA O IDB/i }) });

    await secaoSobre.getByRole('link', { name: 'Saiba mais' }).click();

    await expect(page).toHaveURL(/\/quem-somos$/);
    await expect(page.getByRole('heading', { name: 'Missão' })).toBeVisible();
  });

  test('o rodapé tem o link para a página', async ({ page }) => {
    await page.goto('/eventos');
    await page.locator('footer#contato').getByRole('link', { name: 'Missão, visão e valores' }).click();
    await expect(page).toHaveURL(/\/quem-somos$/);
  });

  test('o rodapé mostra a missão salva no painel', async ({ page }) => {
    await comConteudoSalvo(page);
    await page.goto('/');

    const rodape = page.locator('footer#contato');
    await expect(rodape.getByText(CONTEUDO.missao)).toBeVisible();
    await expect(rodape.getByText(MISSAO_PUBLICADA)).toHaveCount(0);
  });

  test('o botão de voltar leva à página inicial', async ({ page }) => {
    await page.goto('/quem-somos');
    await page.getByRole('link', { name: 'Voltar para a página inicial' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
