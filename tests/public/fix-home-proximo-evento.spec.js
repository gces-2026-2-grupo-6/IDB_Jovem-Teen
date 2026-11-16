import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* A home anunciava como "PRÓXIMO EVENTO" algo que já tinha acontecido.
 *
 * O destaque saía de `all[0]` — o primeiro da ordem da API — sempre que não
 * houvesse nenhum evento futuro. Resultado: contagem zerada e um botão
 * "Ver evento" levando ao congresso de 2020.
 *
 * E o filtro olhava só a data de **início**, então um evento de vários dias
 * já em curso não contava como próximo.
 */

const pad = (n) => String(n).padStart(2, '0');
const comOffset = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const evento = (id, nome, inicioDias, fimDias) => ({
  evento_id: id,
  nome,
  descricao: 'x',
  tipo_evento: 'Conferência',
  data_inicio: `${comOffset(inicioDias)}T08:00:00`,
  data_fim: `${comOffset(fimDias)}T18:00:00`,
  datas: null,
  nome_local: 'Sede',
  local_latitude: -15.79,
  local_longitude: -47.88,
  link_galeria: '',
  formulario_link: '',
  formulario_participante_link: '',
  link_imagem: '',
  calendario_evento_id: null,
});

const servir = (page, eventos) =>
  page.route(/^https?:\/\/[^/]+\/evento\/?(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(eventos),
    })
  );

test.describe('Home — evento em destaque', () => {
  test('sem evento em cartaz, não anuncia nenhum', async ({ page }) => {
    await setupApiMock(page);
    /* Só eventos encerrados. Antes, a home mostrava o primeiro deles como
       "próximo", com contagem zerada. */
    await servir(page, [
      evento(1, 'Congresso 2020', -2000, -1998),
      evento(2, 'Retiro do ano passado', -400, -398),
    ]);

    await page.goto('/');
    await page.waitForTimeout(800);

    await expect(page.getByText('PRÓXIMO EVENTO:')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ver evento' })).toHaveCount(0);
  });

  test('evento já em curso é o destaque, e não um futuro distante', async ({ page }) => {
    await setupApiMock(page);
    await servir(page, [
      evento(1, 'Congresso Daqui a Meses', 90, 92),
      /* Começou ontem, termina amanhã: é o que está acontecendo agora. */
      evento(2, 'Acampamento Em Curso', -1, 1),
    ]);

    await page.goto('/');
    await page.getByRole('link', { name: 'Ver evento' }).waitFor();

    await expect(page.getByRole('link', { name: 'Ver evento' })).toHaveAttribute(
      'href',
      /\/eventos\/2-/
    );
  });

  test('havendo futuros, o mais próximo é o destaque', async ({ page }) => {
    await setupApiMock(page);
    await servir(page, [
      evento(1, 'Daqui a Noventa Dias', 90, 91),
      evento(2, 'Daqui a Dez Dias', 10, 11),
    ]);

    await page.goto('/');
    await page.getByRole('link', { name: 'Ver evento' }).waitFor();

    await expect(page.getByRole('link', { name: 'Ver evento' })).toHaveAttribute(
      'href',
      /\/eventos\/2-/
    );
    await expect(page.getByText('PRÓXIMO EVENTO:')).toBeVisible();
  });
});
