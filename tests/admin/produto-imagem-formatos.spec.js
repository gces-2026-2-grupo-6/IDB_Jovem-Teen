import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* A foto do produto não aparecia na loja e ninguém sabia por quê.

   O campo dizia só como compartilhar o arquivo, nada sobre formato, e o
   preview escondia a imagem no onError (`style.display = "none"`). Um .heic
   de iPhone — o caso comum — sumia sem dizer nada, e a pessoa só descobria
   olhando a loja pública depois.

   É o mesmo padrão que escondeu as inscrições do Google Forms: a falha
   existia, a tela não contava. */

test.describe('Produto — formatos aceitos na imagem', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/produtos/criar');
  });

  test('o campo diz quais formatos valem', async ({ page }) => {
    const campo = page.locator('#image');
    await expect(campo).toBeVisible();

    const nota = page.getByText(/Formatos aceitos/i);
    await expect(nota).toBeVisible();
    await expect(nota).toContainText('.jpg');
    await expect(nota).toContainText('.png');
    await expect(nota).toContainText('.webp');
    await expect(nota).toContainText('.heic');
  });

  test('imagem que não carrega vira aviso, não sumiço', async ({ page }) => {
    await page.locator('#image').fill('https://drive.google.com/file/d/1SemImagem/view');

    /* Sem rede para a imagem: o navegador dispara onError. */
    await page.route(/drive\.google\.com|googleusercontent|\/drive\/imagem\//, (route) =>
      route.abort(),
    );
    await page.locator('#image').fill('https://drive.google.com/file/d/1QuebradaDeProposito/view');

    const aviso = page.getByTestId('erro-preview-produto');
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText('.heic');
  });

  test('o aviso some quando a imagem passa a carregar', async ({ page }) => {
    await page.route(/drive\.google\.com|googleusercontent|\/drive\/imagem\//, (route) =>
      route.abort(),
    );
    await page.locator('#image').fill('https://drive.google.com/file/d/1Quebrada/view');
    await expect(page.getByTestId('erro-preview-produto')).toBeVisible();

    /* Uma imagem que o navegador abre de verdade, sem rede: 1x1 PNG embutido.
       Não dá para afirmar nada no instante da troca de link — o onError do
       link novo pode chegar antes da asserção, e foi assim que a versão
       anterior deste teste ficou intermitente no WebKit. O que se verifica é
       o estado final: imagem que carrega, aviso fora da tela. */
    await page.locator('#image').fill(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    );

    await expect(page.getByTestId('erro-preview-produto')).toHaveCount(0);
  });
});
