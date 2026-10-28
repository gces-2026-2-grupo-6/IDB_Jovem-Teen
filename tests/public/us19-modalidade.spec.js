import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* US19 (site público): cada card traz um selo de online ou presencial, um
   filtro mostra só uma das modalidades sem quebrar a ordem cronológica, e o
   evento online troca o endereço pelo link da transmissão (CA2, CA3 e CA5).
   Evento sem o campo, como os já cadastrados, é presencial (CA4). */

const LINK = 'https://youtube.com/live/abc123';

const base = {
  descricao: 'Descrição do evento.',
  tipo_evento: 'Conferência',
  link_galeria: '',
  formulario_link: '',
  formulario_participante_link: '',
  link_imagem: '',
  calendario_evento_id: null,
};

/* Datas no futuro e fora de ordem na lista, para conferir que a ordem
   cronológica sobrevive ao filtro. */
const EVENTOS = [
  {
    ...base,
    evento_id: 901,
    nome: 'Congresso Presencial',
    data_inicio: '2031-08-20T09:00:00',
    data_fim: '2031-08-20T18:00:00',
    nome_local: 'Igreja Central, Brasília - DF',
    local_latitude: -15.79,
    local_longitude: -47.88,
    modalidade: 'presencial',
    link_transmissao: null,
  },
  {
    ...base,
    evento_id: 902,
    nome: 'Live de Oração',
    data_inicio: '2031-06-10T19:00:00',
    data_fim: '2031-06-10T21:00:00',
    nome_local: null,
    local_latitude: null,
    local_longitude: null,
    modalidade: 'online',
    link_transmissao: LINK,
  },
  {
    ...base,
    evento_id: 903,
    nome: 'Culto Online',
    data_inicio: '2031-07-15T19:00:00',
    data_fim: '2031-07-15T21:00:00',
    nome_local: null,
    local_latitude: null,
    local_longitude: null,
    modalidade: 'online',
    link_transmissao: null,
  },
  {
    /* Cadastrado antes da US19: sem `modalidade` nem `link_transmissao`. */
    ...base,
    evento_id: 904,
    nome: 'Retiro Antigo',
    data_inicio: '2031-05-01T08:00:00',
    data_fim: '2031-05-01T18:00:00',
    nome_local: 'Sítio Boa Vista',
    local_latitude: -8.05,
    local_longitude: -34.9,
  },
];

async function mockEventos(page) {
  await setupApiMock(page);
  await page.route(/^https?:\/\/[^/]+\/evento\/?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EVENTOS) });
  });
  await page.route(/^https?:\/\/[^/]+\/evento\/(\d+)$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const id = Number(new URL(route.request().url()).pathname.split('/').pop());
    const evento = EVENTOS.find((e) => e.evento_id === id) || null;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(evento) });
  });
}

function cardsDaGrade(page) {
  /* Card da grade "todos os eventos": filho direto da grade, com o link da
     imagem para a página do evento logo no topo. */
  return page.locator('div.grid > div:has(> a[href^="/eventos/"])');
}

async function titulosDaGrade(page) {
  return cardsDaGrade(page).locator('h3').allInnerTexts();
}

test.describe('US19 - Eventos online e presenciais no site', () => {
  test.beforeEach(async ({ page }) => {
    await mockEventos(page);
  });

  test('a agenda fica em ordem cronológica, não na ordem de cadastro', async ({ page }) => {
    await page.goto('/eventos');
    await expect(cardsDaGrade(page)).toHaveCount(4);
    expect(await titulosDaGrade(page)).toEqual([
      'Retiro Antigo', 'Live de Oração', 'Culto Online', 'Congresso Presencial',
    ]);
  });

  test('cada card da agenda traz o selo da modalidade', async ({ page }) => {
    await page.goto('/eventos');
    await expect(cardsDaGrade(page)).toHaveCount(4);

    const selo = (titulo) =>
      cardsDaGrade(page).filter({ hasText: titulo }).getByTestId('selo-modalidade');

    await expect(selo('Live de Oração')).toHaveText('Online');
    await expect(selo('Culto Online')).toHaveText('Online');
    await expect(selo('Congresso Presencial')).toHaveText('Presencial');
    /* CA4: evento sem o campo aparece como presencial. */
    await expect(selo('Retiro Antigo')).toHaveText('Presencial');
  });

  test('o card do evento online mostra "Evento online" no lugar do endereço', async ({ page }) => {
    await page.goto('/eventos');
    const card = cardsDaGrade(page).filter({ hasText: 'Live de Oração' });
    await expect(card.getByText('Evento online', { exact: true })).toBeVisible();
  });

  test('o filtro de modalidade tem nome acessível e começa sem filtrar', async ({ page }) => {
    await page.goto('/eventos');
    const filtro = page.getByLabel('Modalidade');
    await expect(filtro).toBeVisible();
    await expect(filtro).toHaveValue('Modalidade');
    /* Os outros filtros também ganharam nome para leitor de tela. */
    await expect(page.getByLabel('Tipo de evento')).toBeVisible();
    await expect(page.getByLabel('Região')).toBeVisible();
    await expect(page.getByLabel('Data')).toBeVisible();
  });

  test('filtrar por online mostra só os online, em ordem cronológica', async ({ page }) => {
    await page.goto('/eventos');
    await expect(cardsDaGrade(page)).toHaveCount(4);

    await page.getByLabel('Modalidade').selectOption('Online');

    await expect(cardsDaGrade(page)).toHaveCount(2);
    expect(await titulosDaGrade(page)).toEqual(['Live de Oração', 'Culto Online']);
  });

  test('filtrar por presencial inclui os eventos antigos, sem o campo', async ({ page }) => {
    await page.goto('/eventos');
    await page.getByLabel('Modalidade').selectOption('Presencial');

    await expect(cardsDaGrade(page)).toHaveCount(2);
    expect(await titulosDaGrade(page)).toEqual(['Retiro Antigo', 'Congresso Presencial']);
  });

  test('voltar o filtro para "Modalidade" mostra todos de novo', async ({ page }) => {
    await page.goto('/eventos');
    await page.getByLabel('Modalidade').selectOption('Online');
    await expect(cardsDaGrade(page)).toHaveCount(2);

    await page.getByLabel('Modalidade').selectOption('Modalidade');
    await expect(cardsDaGrade(page)).toHaveCount(4);
  });

  test('o filtro de modalidade combina com o de tipo', async ({ page }) => {
    await page.goto('/eventos');
    await page.getByLabel('Modalidade').selectOption('Online');
    await page.getByLabel('Tipo de evento').selectOption('Acampamento');

    await expect(cardsDaGrade(page)).toHaveCount(0);
  });

  test('o destaque "Em breve" também traz o selo', async ({ page }) => {
    await page.goto('/eventos');
    /* O mais próximo é o "Retiro Antigo" (maio), que é presencial. */
    const destaque = page.locator('section').filter({ hasText: 'Em breve' });
    await expect(destaque.getByTestId('selo-modalidade').first()).toHaveText('Presencial');
  });

  test('a página do evento online mostra o selo e o botão da transmissão', async ({ page }) => {
    await page.goto('/eventos/902-live-de-oracao');

    await expect(page.getByRole('heading', { name: 'Live de Oração' })).toBeVisible();
    await expect(page.getByTestId('selo-modalidade')).toHaveText('Online');
    await expect(page.getByText('Evento online', { exact: true })).toBeVisible();

    const transmissao = page.getByRole('link', { name: 'Assistir à transmissão' });
    await expect(transmissao).toHaveAttribute('href', LINK);
    await expect(transmissao).toHaveAttribute('target', '_blank');
  });

  test('evento online sem link ainda não mostra o botão da transmissão', async ({ page }) => {
    await page.goto('/eventos/903-culto-online');

    await expect(page.getByTestId('selo-modalidade')).toHaveText('Online');
    await expect(page.getByRole('link', { name: 'Assistir à transmissão' })).toHaveCount(0);
  });

  test('a página do evento presencial continua com o endereço', async ({ page }) => {
    await page.goto('/eventos/901-congresso-presencial');

    await expect(page.getByTestId('selo-modalidade')).toHaveText('Presencial');
    await expect(page.getByText('Igreja Central, Brasília - DF')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Assistir à transmissão' })).toHaveCount(0);
  });

  test('"Adicionar ao Google Calendar" leva o link da transmissão no local', async ({ page }) => {
    await page.goto('/eventos/902-live-de-oracao');

    const href = await page.getByRole('link', { name: 'Adicionar ao Google Calendar' }).getAttribute('href');
    expect(new URL(href).searchParams.get('location')).toBe(LINK);
  });

  test('o mapa de eventos próximos ignora os eventos online', async ({ page }) => {
    /* CA3: evento sem coordenadas não pode quebrar a página do mapa. */
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: -15.79, longitude: -47.88 });
    await page.goto('/eventos-proximos');

    await expect(page.getByText('Congresso Presencial').first()).toBeVisible();
    await expect(page.getByText('Live de Oração')).toHaveCount(0);
  });
});
