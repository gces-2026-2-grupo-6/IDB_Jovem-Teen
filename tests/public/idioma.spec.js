import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

// Regressão: com lang="en" o navegador móvel oferecia traduzir a página e,
// ao reescrever os nós de texto, duplicava a foto de um líder na página inicial.

const secaoLideres = (page) => page.locator('section.bg-\\[\\#D5650D\\]');

test.describe('Idioma da página', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('deve declarar pt-BR no documento, inclusive em rotas internas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await page.goto('/eventos');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('não deve oferecer tradução automática (meta notranslate)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="google"]')).toHaveAttribute('content', 'notranslate');
  });

  test('nomes próprios devem ser marcados como não traduzíveis', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'IDB JOVEM & TEEN', exact: true })).toHaveAttribute('translate', 'no');

    const secao = secaoLideres(page);
    await secao.scrollIntoViewIfNeeded();
    const nomes = secao.locator('h4');
    await expect(nomes.first()).toBeVisible();
    for (const nome of await nomes.all()) {
      await expect(nome).toHaveAttribute('translate', 'no');
    }
  });

  test('não deve haver líder nem foto duplicada na página inicial', async ({ page }) => {
    await page.goto('/');
    const secao = secaoLideres(page);
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.locator('h4').first()).toBeVisible();

    for (const aba of ['Líderes Atuais', 'Galeria de Diretores']) {
      const botao = secao.getByRole('button', { name: aba });
      if (await botao.count()) await botao.click();

      const nomes = await secao.locator('h4').allInnerTexts();
      expect(new Set(nomes).size).toBe(nomes.length);

      const fotos = await secao.locator('img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')));
      expect(new Set(fotos).size).toBe(fotos.length);
    }
  });
});
