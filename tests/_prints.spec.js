/* Captura de telas da US01, para o relatório. Não é teste de comportamento:
   monta cenários controlados e salva as imagens em docs/img.

   Fica desligado por padrão, para não rodar na suíte nem reescrever as imagens
   em CI. Para regerar:

       PRINTS=1 npx playwright test tests/_prints.spec.js
*/
import { test } from './helpers/testWithCoverage.js';
import { loginAsAdmin } from './helpers/adminAuth';
import { setupApiMock } from './helpers/apiMock';

const DIR = 'docs/img/us01';

const pad = (n) => String(n).padStart(2, '0');
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noMesSeguinte = (dia) => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
};

function evento({ id, nome, descricao, inicio, fim, datas = null, local = 'Chácara Betel' }) {
  return {
    evento_id: id,
    datas,
    nome,
    descricao,
    data_inicio: inicio,
    data_fim: fim,
    nome_local: local,
    local_latitude: -15.7934,
    local_longitude: -47.8822,
    link_galeria: '',
    formulario_link: 'https://forms.gle/exemplo',
    link_imagem: '',
    tipo_evento: 'Conferência',
    calendario_evento_id: null,
  };
}

const s1 = noMesSeguinte(4);
const s2 = noMesSeguinte(11);
const s3 = noMesSeguinte(18);

const ESCOLA_DE_LIDERES = evento({
  id: 8001,
  nome: 'Escola de Líderes',
  descricao: 'Formação em três sábados, com certificado ao fim do último encontro.',
  inicio: `${chave(s1)}T08:00:00`,
  fim: `${chave(s3)}T18:00:00`,
  datas: [chave(s1), chave(s2), chave(s3)],
  local: 'Sede Nacional',
});

const ACAMPAMENTO = evento({
  id: 8002,
  nome: 'Acampamento de Inverno',
  descricao: 'Três dias de acampamento na serra, com programação integral.',
  inicio: `${chave(noMesSeguinte(21))}T14:00:00`,
  fim: `${chave(noMesSeguinte(23))}T16:00:00`,
});

const CULTO = evento({
  id: 8003,
  nome: 'Culto de Celebração',
  descricao: 'Uma noite de louvor e palavra.',
  inicio: `${chave(noMesSeguinte(27))}T19:00:00`,
  fim: `${chave(noMesSeguinte(27))}T22:00:00`,
  local: 'Templo Central',
});

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

test.describe('prints da US01', () => {
  test.skip(!process.env.PRINTS, 'defina PRINTS=1 para regerar as capturas');
  test.use({ viewport: { width: 1280, height: 900 } });

  test('calendário da home com os três formatos de data', async ({ page }) => {
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES, ACAMPAMENTO, CULTO]);
    await page.goto('/');

    const secao = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: /Calendário de Eventos/i }) });

    await secao.getByRole('button', { name: 'Próximo mês' }).click();
    await page.getByRole('heading', { name: 'Escola de Líderes' }).first().waitFor();
    await page.waitForTimeout(400);

    await secao.screenshot({ path: `${DIR}/01-home-calendario.png` });
  });

  test('página do evento com dias avulsos', async ({ page }) => {
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES]);
    await page.goto('/eventos/8001-escola-de-lideres');
    await page.getByText('em cada dia').waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/02-evento-dias-avulsos.png` });
  });

  test('página do evento com período contínuo', async ({ page }) => {
    await setupApiMock(page);
    await serveEvents(page, [ACAMPAMENTO]);
    await page.goto('/eventos/8002-acampamento-de-inverno');
    await page.getByText('Início 14:00').waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/03-evento-periodo.png` });
  });

  test('formulário no modo dias avulsos', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES]);
    await page.goto('/admin/eventos/8001/editar');

    await page.getByLabel('Dia 3 do evento').waitFor();
    await page.waitForTimeout(500);

    const formulario = page.locator('form');
    await formulario.screenshot({ path: `${DIR}/04-form-dias-avulsos.png` });
  });

  test('formulário no modo dias seguidos', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveEvents(page, [ACAMPAMENTO]);
    await page.goto('/admin/eventos/8002/editar');

    await page.locator('input[name="endDay"]').waitFor();
    await page.waitForTimeout(500);

    const formulario = page.locator('form');
    await formulario.screenshot({ path: `${DIR}/05-form-dias-seguidos.png` });
  });

  test('listagem do admin com as caixas de data', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES, ACAMPAMENTO, CULTO]);
    await page.goto('/admin/eventos');

    await page.getByText('+ 2 dias').waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/06-admin-listagem.png` });
  });

  test('recorte do card Próximos Eventos', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES, ACAMPAMENTO, CULTO]);
    await page.goto('/admin/eventos');
    await page.getByText('+ 2 dias').waitFor();
    await page.waitForTimeout(400);

    const card = page
      .locator('div.rounded-2xl')
      .filter({ has: page.getByRole('heading', { name: 'Próximos Eventos' }) })
      .first();
    await card.screenshot({ path: `${DIR}/13-admin-proximos.png` });
  });

  test('recorte do topo da página do evento', async ({ page }) => {
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES]);
    await page.goto('/eventos/8001-escola-de-lideres');
    await page.getByText('em cada dia').waitFor();
    await page.waitForTimeout(500);

    const hero = page.locator('section').first();
    await hero.screenshot({ path: `${DIR}/14-evento-hero.png` });
  });

  test('recorte dos cards do calendário', async ({ page }) => {
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES, ACAMPAMENTO, CULTO]);
    await page.goto('/');

    const secao = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: /Calendário de Eventos/i }) });
    await secao.getByRole('button', { name: 'Próximo mês' }).click();
    await page.getByRole('heading', { name: 'Escola de Líderes' }).first().waitFor();
    await page.waitForTimeout(400);

    const lista = secao.locator('div.space-y-4').first();
    await lista.screenshot({ path: `${DIR}/10-cards-calendario.png` });
  });

  test('recorte do bloco "Quando acontece"', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES]);
    await page.goto('/admin/eventos/8001/editar');
    await page.getByLabel('Dia 3 do evento').waitFor();
    await page.waitForTimeout(400);

    const bloco = page
      .locator('div.mb-1')
      .filter({ hasText: 'Quando acontece' })
      .first();
    await bloco.screenshot({ path: `${DIR}/08-form-quando-acontece.png` });
  });

  test('recorte de um card do calendário', async ({ page }) => {
    await setupApiMock(page);
    await serveEvents(page, [ESCOLA_DE_LIDERES]);
    await page.goto('/');

    const secao = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: /Calendário de Eventos/i }) });
    await secao.getByRole('button', { name: 'Próximo mês' }).click();
    await page.waitForTimeout(400);

    const card = secao
      .locator('div.rounded-2xl')
      .filter({ hasText: 'Escola de Líderes' })
      .last();
    await card.screenshot({ path: `${DIR}/09-card-dias-avulsos.png` });
  });

  test('mini calendário do dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);

    /* Evento em curso nesta semana, para a grade mostrar as colunas ocupadas. */
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - hoje.getDay() + 1); // segunda desta semana
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 2);

    await serveEvents(page, [
      evento({
        id: 8004,
        nome: 'Congresso Nacional',
        descricao: 'Três dias de congresso.',
        inicio: `${chave(inicio)}T09:00:00`,
        fim: `${chave(fim)}T17:00:00`,
      }),
    ]);

    await page.goto('/admin');
    await page.getByRole('heading', { name: 'Calendário' }).waitFor();
    await page.waitForTimeout(600);

    const mini = page
      .locator('div.rounded-2xl')
      .filter({ has: page.getByRole('heading', { name: 'Calendário' }) })
      .first();
    await mini.screenshot({ path: `${DIR}/07-dashboard-mini-calendario.png` });
  });
});
