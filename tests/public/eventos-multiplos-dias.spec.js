import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

/* Datas montadas em relação a hoje: o calendário da home abre sempre no mês
   corrente, então um evento com data fixa deixaria de ser exercitado com o
   passar do tempo. */
const pad = (n) => String(n).padStart(2, '0');
const shiftDays = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
};
const iso = (d, hora) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${hora}:00`;
const br = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

function evento({ id, nome, inicio, fim, datas = null }) {
  return {
    evento_id: id,
    datas,
    nome,
    descricao: 'Evento de vários dias.',
    data_inicio: inicio,
    data_fim: fim,
    nome_local: 'Sítio Boa Vista',
    local_latitude: -8.05,
    local_longitude: -34.9,
    link_galeria: '',
    formulario_link: '',
    link_imagem: '',
    tipo_evento: 'Acampamento',
    calendario_evento_id: null,
  };
}

/* Serve uma lista de eventos controlada por cima do mock padrão. As demais
   rotas de /evento (atividades, participantes, galeria) caem no mock via
   `fallback`. */
async function serveEvents(page, eventos) {
  await page.route('**/evento**', async (route) => {
    const req = route.request();
    const url = req.url();

    if (req.method() === 'GET' && /\/evento\/?(\?.*)?$/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(eventos),
      });
    }

    const porId = url.match(/\/evento\/(\d+)(\?.*)?$/);
    if (req.method() === 'GET' && porId) {
      const ev = eventos.find((e) => String(e.evento_id) === porId[1]);
      if (ev) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(ev),
        });
      }
    }

    return route.fallback();
  });
}

const calendario = (page) =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: /Calendário de Eventos/i }) });

test.describe('Evento em múltiplos dias — calendário da home', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('evento já iniciado e ainda em curso continua no calendário', async ({ page }) => {
    const inicio = shiftDays(-2);
    const fim = shiftDays(3);
    await serveEvents(page, [
      evento({
        id: 5001,
        nome: 'Acampamento de Inverno',
        inicio: iso(inicio, '08:00'),
        fim: iso(fim, '18:00'),
      }),
    ]);

    await page.goto('/');
    const secao = calendario(page);

    /* O corte por data de início derrubava este evento do calendário. */
    await expect(secao.getByRole('heading', { name: 'Acampamento de Inverno' })).toBeVisible();
    await expect(secao.getByText(`${br(inicio)} - ${br(fim)}`)).toBeVisible();
  });

  test('aparece como um único card, não um card por dia', async ({ page }) => {
    const inicio = shiftDays(1);
    const fim = shiftDays(4);
    await serveEvents(page, [
      evento({
        id: 5002,
        nome: 'Congresso de Quatro Dias',
        inicio: iso(inicio, '09:00'),
        fim: iso(fim, '17:00'),
      }),
    ]);

    await page.goto('/');
    const secao = calendario(page);

    await expect(
      secao.getByRole('heading', { name: 'Congresso de Quatro Dias' })
    ).toHaveCount(1);
    await expect(secao.getByText(`${br(inicio)} - ${br(fim)}`)).toBeVisible();
  });

  test('evento de um dia mostra data única, sem faixa', async ({ page }) => {
    const dia = shiftDays(2);
    await serveEvents(page, [
      evento({ id: 5003, nome: 'Culto Especial', inicio: iso(dia, '19:00'), fim: iso(dia, '22:00') }),
    ]);

    await page.goto('/');
    const secao = calendario(page);

    await expect(secao.getByRole('heading', { name: 'Culto Especial' })).toBeVisible();
    await expect(secao.getByText(br(dia), { exact: true })).toBeVisible();
    await expect(secao.getByText(`${br(dia)} - `)).toHaveCount(0);
  });

  test('evento que atravessa a virada do mês aparece nos dois meses', async ({ page }) => {
    const hoje = new Date();
    const primeiroDoProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    const inicio = new Date(primeiroDoProximoMes);
    inicio.setDate(inicio.getDate() - 2);
    const fim = new Date(primeiroDoProximoMes);
    fim.setDate(fim.getDate() + 2);

    await serveEvents(page, [
      evento({
        id: 5004,
        nome: 'Acampamento da Virada',
        inicio: iso(inicio, '08:00'),
        fim: iso(fim, '18:00'),
      }),
    ]);

    await page.goto('/');
    const secao = calendario(page);
    const titulo = secao.getByRole('heading', { name: 'Acampamento da Virada' });

    /* Mês corrente: o evento começa nele. */
    await expect(titulo).toBeVisible();

    /* Mês seguinte: o evento termina nele e antes desaparecia da listagem. */
    await secao.getByRole('button', { name: 'Próximo mês' }).click();
    await expect(titulo).toBeVisible();
    await expect(secao.getByText(`${br(inicio)} - ${br(fim)}`)).toBeVisible();
  });
});

test.describe('Evento em múltiplos dias — página do evento', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('nomeia início e término, que soltos seriam ambíguos', async ({ page }) => {
    const inicio = shiftDays(1);
    const fim = shiftDays(3);
    await serveEvents(page, [
      evento({
        id: 5005,
        nome: 'Retiro de Três Dias',
        inicio: iso(inicio, '08:00'),
        fim: iso(fim, '18:00'),
      }),
    ]);

    await page.goto('/eventos/5005-retiro-de-tres-dias');

    await expect(page.getByText(`${br(inicio)} - ${br(fim)}`)).toBeVisible();
    await expect(page.getByText('Início 08:00 · Término 18:00')).toBeVisible();
  });

  test('evento de um dia mantém o intervalo de horário curto', async ({ page }) => {
    const dia = shiftDays(2);
    await serveEvents(page, [
      evento({ id: 5006, nome: 'Vigília', inicio: iso(dia, '22:00'), fim: iso(dia, '23:30') }),
    ]);

    await page.goto('/eventos/5006-vigilia');

    await expect(page.getByText('22:00 - 23:30')).toBeVisible();
    await expect(page.getByText('Início 22:00')).toHaveCount(0);
  });
});

/* ------------------------------------------------------------------ *
 * Dias não consecutivos — o evento acontece em dias avulsos, e os dias
 * entre eles não fazem parte dele.
 * ------------------------------------------------------------------ */

const pt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

/* Dia fixo de um mês à frente: os três dias caem no mesmo mês e no futuro,
   independentemente de quando o teste roda. */
const diaDoMesSeguinte = (dia, mesesAFrente = 1) => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + mesesAFrente, dia);
};
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

test.describe('Dias não consecutivos — calendário da home', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('três sábados aparecem como um card, listando os dias em vez de faixa', async ({ page }) => {
    const d1 = diaDoMesSeguinte(4);
    const d2 = diaDoMesSeguinte(11);
    const d3 = diaDoMesSeguinte(18);

    await serveEvents(page, [
      evento({
        id: 7001,
        nome: 'Escola de Líderes',
        inicio: `${chave(d1)}T08:00:00`,
        fim: `${chave(d3)}T18:00:00`,
        datas: [chave(d1), chave(d2), chave(d3)],
      }),
    ]);

    await page.goto('/');
    const secao = calendario(page);
    await secao.getByRole('button', { name: 'Próximo mês' }).click();

    await expect(secao.getByRole('heading', { name: 'Escola de Líderes' })).toHaveCount(1);

    /* Os dias marcados, não o intervalo entre as pontas. */
    await expect(
      secao.getByText(`${pad(d1.getDate())}, ${pad(d2.getDate())} e ${pt(d3)}`)
    ).toBeVisible();

    /* A caixa de data conta os outros dias em vez de dizer "até". */
    await expect(secao.getByText('+ 2 dias')).toBeVisible();
    await expect(secao.getByText('até', { exact: false })).toHaveCount(0);
  });

  test('não aparece em mês que fica entre os dias marcados', async ({ page }) => {
    const primeiro = diaDoMesSeguinte(10, 1);
    const ultimo = diaDoMesSeguinte(10, 3);

    await serveEvents(page, [
      evento({
        id: 7002,
        nome: 'Encontro Trimestral',
        inicio: `${chave(primeiro)}T08:00:00`,
        fim: `${chave(ultimo)}T18:00:00`,
        datas: [chave(primeiro), chave(ultimo)],
      }),
    ]);

    await page.goto('/');
    const secao = calendario(page);
    const titulo = secao.getByRole('heading', { name: 'Encontro Trimestral' });
    const proximoMes = secao.getByRole('button', { name: 'Próximo mês' });

    await proximoMes.click();
    await expect(titulo).toBeVisible();

    /* Mês do meio: pelo intervalo contínuo o evento estaria aqui, mas não
       acontece nada neste mês. */
    await proximoMes.click();
    await expect(titulo).toHaveCount(0);

    await proximoMes.click();
    await expect(titulo).toBeVisible();
  });
});

test.describe('Dias não consecutivos — página do evento', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('lista os dias e diz que o horário vale para cada um', async ({ page }) => {
    const d1 = diaDoMesSeguinte(4);
    const d2 = diaDoMesSeguinte(11);
    const d3 = diaDoMesSeguinte(18);

    await serveEvents(page, [
      evento({
        id: 7003,
        nome: 'Escola de Líderes',
        inicio: `${chave(d1)}T08:00:00`,
        fim: `${chave(d3)}T18:00:00`,
        datas: [chave(d1), chave(d2), chave(d3)],
      }),
    ]);

    await page.goto('/eventos/7003-escola-de-lideres');

    await expect(
      page.getByText(`${pad(d1.getDate())}, ${pad(d2.getDate())} e ${pt(d3)}`)
    ).toBeVisible();
    await expect(page.getByText('08:00 - 18:00 em cada dia')).toBeVisible();
  });
});
