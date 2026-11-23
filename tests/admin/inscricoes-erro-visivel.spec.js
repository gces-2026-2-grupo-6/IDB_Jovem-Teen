import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* As listagens de inscrição vêm de um formulário do Google, e a integração tem
   três modos de falhar: link que o servidor não consegue resolver, formulário a
   que a conta do site não tem acesso, e credencial do Google vencida. Em todos
   eles a API responde 502 com a causa escrita no campo `detail`.

   Até 23/11/2026 o `catch` dos painéis não recebia o erro, então a tela caía no
   texto genérico e a falha de integração ficava indistinguível de "ninguém se
   inscreveu ainda". Na reunião de validação a cliente preencheu um formulário
   ao vivo, a inscrição não apareceu, e não havia nada na tela que dissesse por
   quê — o motivo estava no corpo da resposta, que ninguém mostrava.

   Estes testes falham se alguém voltar a engolir o `detail`. */

const DETALHE = 'Falha ao buscar formulario no Google Forms';

/* Registrada depois do setupApiMock de propósito: no Playwright a rota mais
   recente tem precedência, então esta substitui a do mock. */
async function quebrarIntegracao(page, trecho) {
  await page.route(
    new RegExp(`/formulario/eventos/\\d+/${trecho}$`),
    (route) =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ detail: DETALHE }),
      }),
  );
}

test.describe('Inscrições — a causa da falha aparece na tela', () => {
  test('voluntários: a tela mostra o motivo que o servidor devolveu', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await quebrarIntegracao(page, 'inscricoes');

    await page.goto('/admin/voluntarios/1');

    await expect(page.getByText(DETALHE)).toBeVisible();
  });

  test('participantes: a tela mostra o motivo que o servidor devolveu', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await quebrarIntegracao(page, 'participantes');

    await page.goto('/admin/voluntarios/1');
    await page.getByRole('tab', { name: /participante/i }).click();

    await expect(page.getByText(DETALHE)).toBeVisible();
  });

  test('sem causa legível, cai no texto genérico em vez de lista vazia', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.route(/\/formulario\/eventos\/\d+\/inscricoes$/, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/admin/voluntarios/1');

    await expect(
      page.getByText(/Não foi possível carregar as inscrições deste evento/i),
    ).toBeVisible();
  });
});
