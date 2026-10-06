import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US15 — histórico de eventos passados com fotos.
 *
 * Até esta entrega um evento encerrado sumia do site público: a agenda, o mapa
 * e a home filtram todos por `isOngoingOrFuture`. As fotos existiam na
 * galeria, mas soltas do evento que as originou.
 *
 * Nas fixtures há dois eventos passados: "Congresso 2020" (2020, com álbum de
 * 1 foto) e "Evento Null Fields" (2019, sem álbum e sem local).
 */

const secaoHistorico = (page) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: 'Já aconteceram' }) });

test.describe('US15 - Histórico de eventos passados', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await page.goto('/eventos');
  });

  test('deve listar os eventos encerrados, do mais recente para o mais antigo', async ({ page }) => {
    const secao = secaoHistorico(page);
    await expect(secao).toBeVisible();

    const titulos = secao.locator('h3');
    await expect(titulos).toHaveCount(2);
    await expect(titulos.nth(0)).toHaveText('Congresso 2020');
    await expect(titulos.nth(1)).toHaveText('Evento Null Fields');
  });

  test('deve anunciar a quantidade de fotos só no evento que tem álbum', async ({ page }) => {
    const secao = secaoHistorico(page);
    await expect(secao.getByText('1 foto')).toBeVisible();

    // O evento sem álbum não promete foto nenhuma
    const cardSemAlbum = secao.getByRole('link', { name: /Evento Null Fields/ });
    await expect(cardSemAlbum.getByText(/foto/)).toHaveCount(0);
  });

  test('deve levar à página do evento, onde ficam as fotos', async ({ page }) => {
    await secaoHistorico(page).getByRole('link', { name: /Congresso 2020/ }).click();

    await expect(page).toHaveURL(/\/eventos\/3-congresso-2020/);
    await expect(page.getByRole('heading', { name: 'Congresso 2020' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Galeria do evento' })).toBeVisible();
  });

  test('não deve misturar evento encerrado com a agenda', async ({ page }) => {
    /* A grade de cima segue só com o que ainda vai acontecer — o histórico é
       uma seção à parte, não um item a mais na agenda. */
    const agenda = page.locator('section.pb-20 > div > div.grid');
    await expect(agenda.getByText('Congresso 2020')).toHaveCount(0);
    await expect(agenda.getByText('Retiro de Verão')).toBeVisible();
  });
});

test.describe('US15 - Histórico sem eventos encerrados', () => {
  test('não deve exibir a seção quando todo evento ainda está por vir', async ({ page }) => {
    await setupApiMock(page);

    /* Devolve só um evento futuro: sem nada encerrado, a seção some em vez de
       aparecer vazia. */
    await page.route(/\/evento\/?(\?.*)?$/, (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            evento_id: 2,
            nome: 'Acampamento Jovem',
            descricao: 'Acampamento de fim de semana.',
            data_inicio: '2030-03-10T08:00:00',
            data_fim: '2030-03-12T18:00:00',
            nome_local: 'Camping Serra Azul',
            local_latitude: -8.1,
            local_longitude: -35.0,
            link_galeria: '',
            formulario_link: '',
            link_imagem: '',
            calendario_evento_id: null,
          },
        ]),
      });
    });

    await page.goto('/eventos');

    await expect(page.getByRole('heading', { name: 'Eventos', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Já aconteceram' })).toHaveCount(0);
  });
});
