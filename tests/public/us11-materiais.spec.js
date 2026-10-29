import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US11 — Materiais para download, área pública.
 *
 * "Todas as pessoas podem baixar, sem login." O arquivo continua no Drive: o
 * site guarda o cadastro e o link, e o botão "Baixar" aponta para o
 * `url_download` que o back-end entrega pronto.
 *
 * No mock: um documento e uma foto do Drive, e um vídeo que é link externo.
 */

test.describe('US11 - Área pública de materiais', () => {
  test('CA3: o visitante sem login vê a lista e baixa sem o site pedir para entrar', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/materiais');

    await expect(page.getByRole('heading', { name: /Materiais para/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Manual do Líder 2026' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Foto oficial da diretoria' })).toBeVisible();

    /* Em nenhum momento o site manda para o login. */
    await expect(page).toHaveURL(/\/materiais$/);
  });

  test('CA1: cada material é identificado pelo tipo', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/materiais');

    const manual = page.getByRole('article').filter({ hasText: 'Manual do Líder 2026' });
    await expect(manual.getByText('Documento')).toBeVisible();
    await expect(manual.getByText('Versão para impressão')).toBeVisible();

    const foto = page.getByRole('article').filter({ hasText: 'Foto oficial da diretoria' });
    await expect(foto.getByText('Foto', { exact: true })).toBeVisible();
  });

  test('o botão Baixar aponta para o url_download que o back-end entregou', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/materiais');

    const manual = page.getByRole('article').filter({ hasText: 'Manual do Líder 2026' });
    const baixar = manual.getByRole('link', { name: 'Baixar' });

    await expect(baixar).toHaveAttribute('href', 'http://api.test/drive/download/manual');
    await expect(baixar).toHaveAttribute('download', '');
  });

  test('link externo abre em nova aba em vez de baixar', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/materiais');

    /* O vídeo do YouTube não passa pelo nosso back-end: não há arquivo para
       baixar, e forçar o download daria em nada. */
    const video = page.getByRole('article').filter({ hasText: 'Vídeo institucional' });
    const abrir = video.getByRole('link', { name: 'Abrir' });

    await expect(abrir).toHaveAttribute('href', 'https://youtube.com/watch?v=abc');
    await expect(abrir).toHaveAttribute('target', '_blank');
    await expect(video.getByRole('link', { name: 'Baixar' })).toHaveCount(0);
  });

  test('o filtro por tipo mostra só os materiais daquele tipo', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/materiais');

    await page.getByRole('button', { name: 'Vídeos' }).click();

    await expect(page.getByRole('heading', { name: 'Vídeo institucional' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Manual do Líder 2026' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Todos' }).click();
    await expect(page.getByRole('heading', { name: 'Manual do Líder 2026' })).toBeVisible();
  });

  test('CA3: o visitante chega aos materiais a partir da página inicial', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/');
    await page.getByRole('link', { name: 'Materiais' }).first().click();

    await expect(page).toHaveURL(/\/materiais$/);
    await expect(page.getByRole('heading', { name: /Materiais para/ })).toBeVisible();
  });

  test('lista vazia explica a ausência em vez de deixar a tela em branco', async ({ page }) => {
    await setupApiMock(page);
    await page.route(/\/material\/?(\?|$)/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await page.goto('/materiais');

    await expect(page.getByText('Nenhum material publicado ainda.')).toBeVisible();
  });
});

test.describe('US11 - CA5: download em toda foto publicada', () => {
  test('a galeria do evento oferece baixar cada foto', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/eventos/1-retiro-de-verao');

    const galeria = page.locator('section').filter({ hasText: 'Galeria do evento' });
    const baixar = galeria.getByRole('link', { name: /^Baixar / });

    await expect(baixar.first()).toHaveAttribute('href', 'http://api.test/drive/download/foto1');
    expect(await baixar.count()).toBe(2);
  });

  test('a galeria pública oferece baixar dentro do álbum', async ({ page }) => {
    await setupApiMock(page);

    await page.goto('/galeria');

    await page.getByRole('button', { name: /Retiro de Verão/ }).first().click();

    const baixar = page.getByRole('link', { name: /^Baixar foto de/ });
    await expect(baixar.first()).toHaveAttribute('href', 'http://api.test/drive/download/foto1');
  });
});
