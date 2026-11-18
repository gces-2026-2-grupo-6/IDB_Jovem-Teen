import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* RF51 — histórico de participações por convidado.
 *
 * A API não tem rota de "eventos de um convidado": o vínculo só é legível
 * pelo lado do evento. O front agrega, e esta suíte cobre a agregação e a
 * tela que a exibe.
 *
 * Cenário: o pregador está em dois eventos (um de 2030 e um de 2020), a banda
 * em um só, e a líder em nenhum — é o que separa "do mais recente para o mais
 * antigo" de "ainda não vinculado".
 */

const CONVIDADOS = [
  { participante_id: 1, nome: 'Pr. Samuel Tavares', profissao: 'Pregador', link_foto: '' },
  { participante_id: 2, nome: 'Adoração Viva', profissao: 'Banda', link_foto: '' },
  { participante_id: 3, nome: 'Mariley Ribeiro', profissao: 'Líder', link_foto: '' },
];

const EVENTOS = [
  {
    evento_id: 1,
    nome: 'Conferência Nacional',
    descricao: 'Evento futuro.',
    tipo_evento: 'Conferência',
    data_inicio: '2030-05-10T08:00:00',
    data_fim: '2030-05-10T18:00:00',
    nome_local: 'Sede Nacional',
    local_latitude: -15.79,
    local_longitude: -47.88,
    link_galeria: '',
    formulario_link: '',
    link_imagem: '',
    calendario_evento_id: null,
  },
  {
    evento_id: 2,
    nome: 'Congresso 2020',
    descricao: 'Evento antigo.',
    tipo_evento: 'Conferência',
    data_inicio: '2020-03-01T08:00:00',
    data_fim: '2020-03-02T18:00:00',
    nome_local: 'Centro de Convenções',
    local_latitude: -15.78,
    local_longitude: -47.93,
    link_galeria: '',
    formulario_link: '',
    link_imagem: '',
    calendario_evento_id: null,
  },
];

/* Quem está em qual evento. O pregador (1) aparece nos dois. */
const VINCULOS = { 1: [1, 2], 2: [1] };

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/* Padrões com a origem e o caminho inteiro: um glob solto casaria também com
   os módulos que o Vite serve e devolveria JSON no lugar do JavaScript. */
const ROTA_EVENTOS = /^https?:\/\/[^/]+\/evento\/?(\?.*)?$/;
const ROTA_PARTICIPANTES = /^https?:\/\/[^/]+\/evento\/(\d+)\/participantes$/;
const ROTA_CONVIDADOS = /^https?:\/\/[^/]+\/banda-palestrante\/?$/;
const ROTA_CONVIDADO = /^https?:\/\/[^/]+\/banda-palestrante\/(\d+)$/;

async function servirCenario(page) {
  await page.route(ROTA_EVENTOS, (route) => route.fulfill(json(EVENTOS)));

  await page.route(ROTA_PARTICIPANTES, (route) => {
    const eventoId = Number(route.request().url().match(/evento\/(\d+)\//)[1]);
    const ids = VINCULOS[eventoId] || [];
    return route.fulfill(json(CONVIDADOS.filter((c) => ids.includes(c.participante_id))));
  });

  await page.route(ROTA_CONVIDADOS, (route) => route.fulfill(json(CONVIDADOS)));

  await page.route(ROTA_CONVIDADO, (route) => {
    const id = Number(route.request().url().match(/banda-palestrante\/(\d+)$/)[1]);
    const achado = CONVIDADOS.find((c) => c.participante_id === id);
    return route.fulfill(achado ? json(achado) : json({ detail: 'não encontrado' }, 404));
  });
}

test.describe('RF51 - Histórico de participações', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);
    await servirCenario(page);
  });

  test('a listagem leva ao histórico pelo nome do convidado', async ({ page }) => {
    await page.goto('/admin/palestrantes');

    await page.getByRole('link', { name: 'Pr. Samuel Tavares' }).click();

    await expect(page).toHaveURL(/\/admin\/palestrantes\/1$/);
    await expect(page.getByRole('heading', { name: 'Pr. Samuel Tavares' })).toBeVisible();
  });

  test('mostra os eventos do mais recente para o mais antigo', async ({ page }) => {
    await page.goto('/admin/palestrantes/1');

    const secao = page.locator('div').filter({ hasText: 'Participações' }).last();
    await expect(secao.getByText('Conferência Nacional')).toBeVisible();
    await expect(secao.getByText('Congresso 2020')).toBeVisible();

    /* A ordem é o critério: o mais recente primeiro. */
    const titulos = await secao.locator('p.font-semibold').allInnerTexts();
    expect(titulos).toEqual(['Conferência Nacional', 'Congresso 2020']);
  });

  test('resume quantas participações o convidado tem', async ({ page }) => {
    await page.goto('/admin/palestrantes/1');
    await expect(page.getByText('Participou de 2 eventos')).toBeVisible();

    await page.goto('/admin/palestrantes/2');
    await expect(page.getByText('Participou de 1 evento')).toBeVisible();
  });

  test('cada evento leva à página pública dele', async ({ page }) => {
    await page.goto('/admin/palestrantes/1');

    const link = page.getByRole('link', { name: 'Ver evento' }).first();
    await expect(link).toHaveAttribute('href', '/eventos/1-conferencia-nacional');
  });

  test('convidado sem vínculo explica a ausência, em vez de lista vazia', async ({ page }) => {
    await page.goto('/admin/palestrantes/3');

    await expect(page.getByText('Ainda não vinculado a nenhum evento')).toBeVisible();
    await expect(page.getByText(/ainda não foi vinculado a nenhum evento/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver evento' })).toHaveCount(0);
  });

  test('convidado inexistente mostra o estado de não encontrado', async ({ page }) => {
    await page.goto('/admin/palestrantes/9999');

    await expect(page.getByText(/não encontrado|Não foi possível carregar/)).toBeVisible();
  });

  test('falha ao ler um evento não derruba o histórico inteiro', async ({ page }) => {
    /* O evento 2 passa a responder erro: o histórico deve continuar
       mostrando o evento 1, em vez de ficar vazio. */
    await page.route(/^https?:\/\/[^/]+\/evento\/2\/participantes$/, (route) =>
      route.fulfill(json({ detail: 'erro' }, 500))
    );

    await page.goto('/admin/palestrantes/1');

    await expect(page.getByText('Conferência Nacional')).toBeVisible();
    await expect(page.getByText('Participou de 1 evento')).toBeVisible();
  });
});
