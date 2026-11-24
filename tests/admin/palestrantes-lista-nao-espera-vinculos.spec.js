import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* A tela de convidados ficava em "Carregando convidados..." até que TODAS as
   participações chegassem, e a contagem de participações faz uma requisição
   por evento. Com os meses, o número de eventos só cresce; o navegador ainda
   serializa essas chamadas em lotes de seis.

   Enquanto isso, nada da lista existia no DOM — nem o botão Excluir. Foi o
   que derrubou test_excluir_convidado_vinculado_nao_quebra_a_tela no Selenium
   com TimeoutException procurando o botão: ele não quebrou, ainda não tinha
   nascido.

   Agora a lista aparece assim que os convidados chegam, e a contagem entra
   depois. */

const CONVIDADO = {
  participante_id: 4242,
  nome: 'Banda Teste Vinculada',
  profissao: 'Banda',
  link_imagem: '',
};

/* Muitos eventos, como num ambiente que acumulou execuções. */
const EVENTOS = Array.from({ length: 40 }, (_, i) => ({
  evento_id: 9000 + i,
  nome: `Evento acumulado ${i}`,
  descricao: '',
  data_inicio: '2026-12-01T10:00:00',
  data_fim: '2026-12-01T11:00:00',
  nome_local: 'Sede',
  local_latitude: -15.79,
  local_longitude: -47.88,
  link_galeria: '',
  formulario_link: '',
  formulario_participante_link: '',
  link_imagem: '',
  calendario_evento_id: null,
}));

test.describe('Convidados — a lista não espera a contagem de eventos', () => {
  test('o botão Excluir existe antes das participações chegarem', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);

    await page.route(/\/banda-palestrante\/?$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CONVIDADO]),
      }),
    );
    await page.route(/\/evento\/?$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EVENTOS),
      }),
    );

    /* Cada participação demora. Antes, isso segurava a tela inteira. */
    let pendentes = 0;
    await page.route(/\/evento\/\d+\/participantes$/, async (route) => {
      pendentes += 1;
      await new Promise((r) => setTimeout(r, 4000));
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/admin/palestrantes');

    /* Sem esperar as participações: o convidado e o botão já estão na tela. */
    const linha = page.locator('div', { hasText: CONVIDADO.nome });
    await expect(page.getByRole('link', { name: CONVIDADO.nome })).toBeVisible({ timeout: 8000 });
    await expect(page.getByTitle('Excluir').first()).toBeVisible({ timeout: 8000 });
    expect(linha).toBeTruthy();

    /* E as participações ainda estavam a caminho quando isso aconteceu. */
    expect(pendentes).toBeGreaterThan(0);
  });

  test('a contagem não afirma "Ainda não vinculado" antes de saber', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a coluna de contagem é escondida no celular (hidden sm:block)');
    await loginAsAdmin(page);
    await setupApiMock(page);

    await page.route(/\/banda-palestrante\/?$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([CONVIDADO]),
      }),
    );
    await page.route(/\/evento\/?$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EVENTOS.slice(0, 2)),
      }),
    );
    await page.route(/\/evento\/\d+\/participantes$/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/admin/palestrantes');
    await expect(page.getByRole('link', { name: CONVIDADO.nome })).toBeVisible({ timeout: 8000 });

    /* Enquanto não sabe, mostra reticências — não uma afirmação errada. */
    await expect(page.getByText('Ainda não vinculado')).toHaveCount(0);
    await expect(page.getByText('...', { exact: true }).first()).toBeVisible();

    /* Quando as participações chegam, a afirmação aparece. */
    await expect(page.getByText('Ainda não vinculado')).toBeVisible({ timeout: 15000 });
  });
});
