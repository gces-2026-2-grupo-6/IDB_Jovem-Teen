import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US10 — o botão de cadastro de líderes no cabeçalho público.

   O botão foi escrito antes em src/components/layout/Header/NavLinks.jsx, um
   arquivo que nenhum outro importava: o cabeçalho que o site realmente usa é
   Header/index.jsx, com a sua própria cópia do nav. O build subiu, a rota
   pública respondia certo, os testes passavam — e o botão não existia na tela,
   porque o componente que o continha nunca era renderizado.

   Estes testes olham a página pronta, não o componente, justamente para que a
   próxima cópia esquecida apareça como falha e não como mistério. */

const LINK = 'https://docs.google.com/forms/d/e/1FAIpQLSexemplo/viewform';

async function servirLinkCadastro(page, valor) {
  await page.route(/\/painel\/link-cadastro-lideres$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ link_cadastro_lideres: valor }),
    }),
  );
}

test.describe('US10 — cadastro de líderes no cabeçalho público', () => {
  test('o botão aparece na home e aponta para o formulário', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no celular o cabeçalho é o menu recolhido; coberto abaixo');
    await setupApiMock(page);
    await servirLinkCadastro(page, LINK);
    await page.goto('/');

    const botao = page.getByTestId('link-cadastro-lideres-publico');
    await expect(botao).toBeVisible();
    await expect(botao).toHaveAttribute('href', LINK);
    await expect(botao).toHaveAttribute('target', '_blank');
    await expect(botao).toHaveAttribute('rel', /noopener/);
  });

  test('o botão aparece em qualquer página pública, não só na home', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no celular o cabeçalho é o menu recolhido; coberto abaixo');
    await setupApiMock(page);
    await servirLinkCadastro(page, LINK);
    await page.goto('/eventos');

    await expect(page.getByTestId('link-cadastro-lideres-publico')).toBeVisible();
  });

  test('sem link fixado, o botão não aparece', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no celular o cabeçalho é o menu recolhido; coberto abaixo');
    await setupApiMock(page);
    await servirLinkCadastro(page, '');
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'IDB JOVEM & TEEN', exact: true })).toBeVisible();
    await expect(page.getByTestId('link-cadastro-lideres-publico')).toHaveCount(0);
  });

  test('no celular o botão está dentro do menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupApiMock(page);
    await servirLinkCadastro(page, LINK);
    await page.goto('/');

    await page.getByRole('button', { name: 'Menu' }).click();

    const botao = page.getByTestId('link-cadastro-lideres-publico-mobile');
    await expect(botao).toBeVisible();
    await expect(botao).toHaveAttribute('href', LINK);
  });

  test('a falha da rota não derruba o cabeçalho', async ({ page }) => {
    await setupApiMock(page);
    await page.route(/\/painel\/link-cadastro-lideres$/, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
    await page.goto('/');

    /* O resto do cabeçalho continua de pé; o botão simplesmente não aparece. */
    await expect(page.getByRole('link', { name: 'IDB Jovem & Teen' })).toBeVisible();
    await expect(page.getByTestId('link-cadastro-lideres-publico')).toHaveCount(0);
  });
});
