import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

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

/* Datas fixas no futuro: a listagem do admin não filtra por mês, então não há
   necessidade de datas relativas aqui. */
const MESMO_MES = evento({
  id: 6001,
  nome: 'Acampamento de Março',
  inicio: '2030-03-10T08:00:00',
  fim: '2030-03-12T18:00:00',
});

const VIRADA_DO_MES = evento({
  id: 6002,
  nome: 'Acampamento da Virada',
  inicio: '2030-07-30T08:00:00',
  fim: '2030-08-02T18:00:00',
});

const UM_DIA = evento({
  id: 6003,
  nome: 'Culto de Celebração',
  inicio: '2030-05-04T19:00:00',
  fim: '2030-05-04T22:00:00',
});

async function serveEvents(page, eventos, capturados = null) {
  await page.route('**/evento**', async (route) => {
    const req = route.request();
    const url = req.url();

    /* Captura o corpo enviado na criação, para conferir o contrato de datas. */
    if (req.method() === 'POST' && /\/evento\/?(\?.*)?$/.test(url)) {
      const body = JSON.parse(req.postData() || '{}');
      if (capturados) capturados.push(body);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...body, evento_id: 9001 }),
      });
    }

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

test.describe('Admin - faixa de datas na listagem de eventos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('evento de vários dias no mesmo mês mostra a faixa de dias', async ({ page }) => {
    await serveEvents(page, [MESMO_MES]);
    await page.goto('/admin/eventos');

    await expect(page.getByText('Acampamento de Março')).toBeVisible();
    await expect(page.getByText('10–12', { exact: true })).toBeVisible();
    await expect(page.getByText('Mar', { exact: true })).toBeVisible();
  });

  test('evento que atravessa a virada mostra os dois meses', async ({ page }) => {
    await serveEvents(page, [VIRADA_DO_MES]);
    await page.goto('/admin/eventos');

    await expect(page.getByText('Acampamento da Virada')).toBeVisible();
    await expect(page.getByText('30 Jul', { exact: true })).toBeVisible();
    await expect(page.getByText('até', { exact: true })).toBeVisible();
    await expect(page.getByText('02 Ago', { exact: true })).toBeVisible();
  });

  test('evento de um dia mantém dia e mês, sem faixa', async ({ page }) => {
    await serveEvents(page, [UM_DIA]);
    await page.goto('/admin/eventos');

    await expect(page.getByText('Culto de Celebração')).toBeVisible();
    await expect(page.getByText('04', { exact: true })).toBeVisible();
    await expect(page.getByText('Mai', { exact: true })).toBeVisible();
    await expect(page.getByText('até', { exact: true })).toHaveCount(0);
  });
});

test.describe('Admin - validação de início e término', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('término anterior ao início é recusado na edição', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Salvar' }).waitFor();

    /* O evento do mock não tem tipo, e o tipo é validado antes da data. */
    await page.selectOption('select[name="tipoEvento"]', 'Acampamento');
    await page.fill('input[name="startDay"]', '2030-06-10');
    await page.fill('input[name="endDay"]', '2030-06-08');

    let mensagem = '';
    page.on('dialog', async (dialog) => {
      mensagem = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(async () => {
      expect(mensagem).toContain('deve ser depois do início');
    }).toPass();

    /* Recusado antes de sair da tela. */
    await expect(page).toHaveURL(/\/admin\/eventos\/1\/editar/);
  });

  /* A API recusa início e término iguais ("o valor final deve ser maior que o
     valor inicial"), então o front recusa antes de enviar. */
  test('término igual ao início é recusado', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Salvar' }).waitFor();

    await page.selectOption('select[name="tipoEvento"]', 'Acampamento');
    await page.fill('input[name="startDay"]', '2030-06-10');
    await page.fill('input[name="startTime"]', '19:00');
    await page.fill('input[name="endDay"]', '2030-06-10');
    await page.fill('input[name="endTime"]', '19:00');

    let mensagem = '';
    page.on('dialog', async (dialog) => {
      mensagem = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(async () => {
      expect(mensagem).toContain('deve ser depois do início');
    }).toPass();
    await expect(page).toHaveURL(/\/admin\/eventos\/1\/editar/);
  });

  test('evento de um dia com horários diferentes é aceito', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByRole('button', { name: 'Salvar' }).waitFor();

    await page.selectOption('select[name="tipoEvento"]', 'Acampamento');
    await page.fill('input[name="startDay"]', '2030-06-10');
    await page.fill('input[name="startTime"]', '19:00');
    await page.fill('input[name="endDay"]', '2030-06-10');
    await page.fill('input[name="endTime"]', '22:00');

    let mensagem = '';
    page.on('dialog', async (dialog) => {
      mensagem = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page).toHaveURL(/\/admin\/eventos$/);
    expect(mensagem).toBe('');
  });
});

/* ------------------------------------------------------------------ *
 * Dias não consecutivos no painel administrativo.
 * ------------------------------------------------------------------ */

const TRES_SABADOS = evento({
  id: 6004,
  nome: 'Escola de Líderes',
  inicio: '2030-08-03T08:00:00',
  fim: '2030-08-17T18:00:00',
  datas: ['2030-08-03', '2030-08-10', '2030-08-17'],
});

async function preencherLocalPelaBusca(page, query = 'Teste') {
  await page.getByPlaceholder('Digite o nome ou endereço do local').fill(query);
  const option = page.locator('ul.absolute button').first();
  await option.waitFor({ state: 'visible' });
  await option.click();
}

test.describe('Admin - dias não consecutivos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('a listagem conta os dias avulsos em vez de mostrar faixa', async ({ page }) => {
    await serveEvents(page, [TRES_SABADOS]);
    await page.goto('/admin/eventos');

    await expect(page.getByText('Escola de Líderes')).toBeVisible();
    await expect(page.getByText('+ 2 dias')).toBeVisible();
    await expect(page.getByText('até', { exact: true })).toHaveCount(0);
  });

  test('editar evento de dias avulsos abre no modo correspondente', async ({ page }) => {
    await serveEvents(page, [TRES_SABADOS]);
    await page.goto('/admin/eventos/6004/editar');

    const opcaoAvulsos = page.getByRole('radio', { name: 'Dias avulsos' });
    await expect(opcaoAvulsos).toHaveAttribute('aria-checked', 'true');

    /* Os três dias salvos voltam preenchidos, cada um no seu campo. */
    await expect(page.getByLabel('Dia 1 do evento')).toHaveValue('2030-08-03');
    await expect(page.getByLabel('Dia 2 do evento')).toHaveValue('2030-08-10');
    await expect(page.getByLabel('Dia 3 do evento')).toHaveValue('2030-08-17');
  });

  test('período contínuo é o modo padrão em evento novo', async ({ page }) => {
    await serveEvents(page, []);
    await page.goto('/admin/eventos/criar');

    await expect(page.getByRole('radio', { name: 'Dias seguidos' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(page.getByLabel('Dia 1 do evento')).toHaveCount(0);
  });

  test('criar evento com dias avulsos envia a lista de datas', async ({ page }) => {
    const enviados = [];
    await serveEvents(page, [], enviados);
    await page.goto('/admin/eventos/criar');

    await page.fill('input[name="title"]', 'Escola de Líderes');
    await page.selectOption('select[name="tipoEvento"]', 'Conferência');
    await preencherLocalPelaBusca(page);

    await page.getByRole('radio', { name: 'Dias avulsos' }).click();

    /* Um campo de dia já vem aberto; os outros dois são acrescentados. */
    await page.getByRole('button', { name: 'Adicionar dia' }).click();
    await page.getByRole('button', { name: 'Adicionar dia' }).click();

    /* Fora de ordem de propósito: a lista é ordenada antes de ser enviada. */
    await page.getByLabel('Dia 1 do evento').fill('2030-08-17');
    await page.getByLabel('Dia 2 do evento').fill('2030-08-03');
    await page.getByLabel('Dia 3 do evento').fill('2030-08-10');

    await page.fill('input[name="startTime"]', '08:00');
    await page.fill('input[name="endTime"]', '18:00');

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(async () => {
      expect(enviados).toHaveLength(1);
    }).toPass();

    const corpo = enviados[0];
    expect(corpo.datas).toEqual(['2030-08-03', '2030-08-10', '2030-08-17']);

    /* Início e término seguem apontando o primeiro e o último dia, para quem
       não conhece o campo `datas`. */
    expect(corpo.data_inicio).toBe('2030-08-03T08:00:00');
    expect(corpo.data_fim).toBe('2030-08-17T18:00:00');
  });

  test('período contínuo não envia lista de datas', async ({ page }) => {
    const enviados = [];
    await serveEvents(page, [], enviados);
    await page.goto('/admin/eventos/criar');

    await page.fill('input[name="title"]', 'Retiro de Carnaval');
    await page.selectOption('select[name="tipoEvento"]', 'Acampamento');
    await preencherLocalPelaBusca(page);

    await page.fill('input[name="startDay"]', '2030-02-14');
    await page.fill('input[name="startTime"]', '19:00');
    await page.fill('input[name="endDay"]', '2030-02-17');
    await page.fill('input[name="endTime"]', '12:00');

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(async () => {
      expect(enviados).toHaveLength(1);
    }).toPass();

    expect(enviados[0].datas).toBeNull();
    expect(enviados[0].data_inicio).toBe('2030-02-14T19:00:00');
    expect(enviados[0].data_fim).toBe('2030-02-17T12:00:00');
  });
});
