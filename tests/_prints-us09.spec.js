/* Captura de telas da US09 — inscrição de participante separada da de
   voluntário. Não é teste de comportamento: monta o cenário e salva as
   imagens em docs/img/US09.

   Desligado por padrão. Para regerar:

       PRINTS=1 npx playwright test tests/_prints-us09.spec.js
*/
import { test } from './helpers/testWithCoverage.js';
import { loginAsAdmin } from './helpers/adminAuth';
import { setupApiMock } from './helpers/apiMock';

const DIR = 'docs/img/US09';

const pad = (n) => String(n).padStart(2, '0');
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noMesSeguinte = (dia) => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
};

/* A conferência abre os dois fluxos; o culto não abre nenhum, e é com ele que
   se mostra o estado de "fluxo ainda não aberto". */
const EVENTOS = [
  {
    evento_id: 1,
    nome: 'Conferência Nacional',
    descricao:
      'Três dias de conferência reunindo jovens e adolescentes de todas as regiões.',
    tipo_evento: 'Conferência',
    data_inicio: `${chave(noMesSeguinte(12))}T08:00:00`,
    data_fim: `${chave(noMesSeguinte(14))}T18:00:00`,
    datas: null,
    nome_local: 'Sede Nacional',
    local_latitude: -15.7934,
    local_longitude: -47.8822,
    link_galeria: '',
    formulario_link: 'https://forms.gle/conferencia-voluntarios',
    formulario_participante_link: 'https://forms.gle/conferencia-participantes',
    link_imagem: '',
    calendario_evento_id: null,
  },
  {
    evento_id: 2,
    nome: 'Culto de Celebração',
    descricao: 'Noite de louvor e palavra.',
    tipo_evento: 'Outros',
    data_inicio: `${chave(noMesSeguinte(27))}T19:00:00`,
    data_fim: `${chave(noMesSeguinte(27))}T22:00:00`,
    datas: null,
    nome_local: 'Templo Central',
    local_latitude: -15.7801,
    local_longitude: -47.9292,
    link_galeria: '',
    formulario_link: '',
    formulario_participante_link: '',
    link_imagem: '',
    calendario_evento_id: null,
  },
];

/* Voluntários passam por aprovação — os três status aparecem na captura. */
const VOLUNTARIOS = [
  {
    evento_id: 1,
    voluntario_id: 100,
    nome: 'Mariana Alves',
    email: 'mariana.alves@email.com',
    status: 'aprovado',
    resposta_id: 'v1',
    link_resposta: 'https://forms.gle/resposta-v1',
  },
  {
    evento_id: 1,
    voluntario_id: 101,
    nome: 'Thiago Barbosa',
    email: 'thiago.barbosa@email.com',
    status: 'pendente',
    resposta_id: 'v2',
    link_resposta: 'https://forms.gle/resposta-v2',
  },
  {
    evento_id: 1,
    voluntario_id: 102,
    nome: 'Juliana Prado',
    email: 'juliana.prado@email.com',
    status: 'pendente',
    resposta_id: 'v3',
    link_resposta: 'https://forms.gle/resposta-v3',
  },
  {
    evento_id: 1,
    voluntario_id: 103,
    nome: 'Eduardo Lima',
    email: 'eduardo.lima@email.com',
    status: 'reprovado',
    resposta_id: 'v4',
    link_resposta: 'https://forms.gle/resposta-v4',
  },
];

/* Participantes não têm status: ninguém aprova quem vai ao evento. */
const PARTICIPANTES = [
  {
    evento_id: 1,
    participante_id: 200,
    nome: 'Beatriz Nogueira',
    email: 'beatriz.nogueira@email.com',
    resposta_id: 'p1',
    link_resposta: 'https://forms.gle/resposta-p1',
  },
  {
    evento_id: 1,
    participante_id: 201,
    nome: 'Lucas Ferreira',
    email: 'lucas.ferreira@email.com',
    resposta_id: 'p2',
    link_resposta: 'https://forms.gle/resposta-p2',
  },
  {
    evento_id: 1,
    participante_id: 202,
    nome: 'Camila Rocha',
    email: 'camila.rocha@email.com',
    resposta_id: 'p3',
    link_resposta: 'https://forms.gle/resposta-p3',
  },
  {
    evento_id: 1,
    participante_id: 203,
    nome: 'Rafael Teixeira',
    email: 'rafael.teixeira@email.com',
    resposta_id: 'p4',
    link_resposta: 'https://forms.gle/resposta-p4',
  },
  {
    evento_id: 1,
    participante_id: 204,
    nome: 'Helena Martins',
    email: 'helena.martins@email.com',
    resposta_id: 'p5',
    link_resposta: 'https://forms.gle/resposta-p5',
  },
];

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

async function serveEventos(page) {
  await page.route('**/evento**', async (route) => {
    const req = route.request();
    const url = req.url();

    if (req.method() === 'GET' && /\/evento\/?(\?.*)?$/.test(url)) {
      return route.fulfill(json(EVENTOS));
    }
    const porId = url.match(/\/evento\/(\d+)(\?.*)?$/);
    if (req.method() === 'GET' && porId) {
      const ev = EVENTOS.find((e) => String(e.evento_id) === porId[1]);
      if (ev) return route.fulfill(json(ev));
    }
    return route.fallback();
  });
}

async function serveInscricoes(page) {
  await page.route('**/formulario/eventos/*/participantes', (route) => {
    const eventoId = Number(route.request().url().match(/eventos\/(\d+)\//)[1]);
    return route.fulfill(json(PARTICIPANTES.filter((p) => p.evento_id === eventoId)));
  });

  await page.route('**/formulario/eventos/*/inscricoes', (route) => {
    const eventoId = Number(route.request().url().match(/eventos\/(\d+)\//)[1]);
    return route.fulfill(json(VOLUNTARIOS.filter((v) => v.evento_id === eventoId)));
  });
}

const aba = (page, nome) => page.getByRole('tab', { name: nome });

test.describe('prints da US09', () => {
  test.skip(!process.env.PRINTS, 'defina PRINTS=1 para regerar as capturas');
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveEventos(page);
  });

  test('formulário do evento com os dois links', async ({ page }) => {
    await serveInscricoes(page);
    await page.goto('/admin/eventos/1/editar');
    await page.locator('input[name="linkFormularioParticipantes"]').waitFor();
    await page.waitForTimeout(500);

    const bloco = page
      .locator('div.mb-1')
      .filter({ hasText: 'Links de Inscrição' })
      .first();
    await bloco.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await bloco.screenshot({ path: `${DIR}/01-form-dois-links.png` });
  });

  test('painel: listagem de voluntários, com aprovação', async ({ page }) => {
    await serveInscricoes(page);
    await page.goto('/admin/voluntarios/1');
    await page.getByText('Mariana Alves').waitFor();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${DIR}/02-aba-voluntarios.png` });
  });

  test('painel: listagem de participantes, sem aprovação', async ({ page }) => {
    await serveInscricoes(page);
    await page.goto('/admin/voluntarios/1');
    await aba(page, 'Participantes').click();
    await page.getByText('Beatriz Nogueira').waitFor();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${DIR}/03-aba-participantes.png` });
  });

  test('painel: troca de status no fluxo de voluntariado', async ({ page }) => {
    await serveInscricoes(page);
    await page.goto('/admin/voluntarios/1');
    await page.getByText('Thiago Barbosa').waitFor();
    await page.getByRole('button', { name: 'Pendente' }).first().click();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/04-status-voluntario.png` });
  });

  test('painel: evento que não abriu o fluxo', async ({ page }) => {
    await serveInscricoes(page);
    await page.goto('/admin/voluntarios/2');
    await aba(page, 'Participantes').click();
    await page.getByText(/ainda não tem link de inscrição/).waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/06-fluxo-nao-aberto.png` });
  });

  test('público: página do evento com os dois botões', async ({ page }) => {
    await serveInscricoes(page);
    await page.goto('/eventos/1-conferencia-nacional');
    await page.getByRole('button', { name: 'Seja Voluntário' }).waitFor();
    await page.waitForTimeout(600);

    const hero = page.locator('section').first();
    await hero.screenshot({ path: `${DIR}/07-evento-dois-botoes.png` });
  });

  test('público: cards da listagem de eventos', async ({ page }) => {
    await serveInscricoes(page);
    await page.goto('/eventos');
    await page.getByRole('heading', { name: 'Conferência Nacional' }).first().waitFor();
    await page.waitForTimeout(800);

    const grid = page.locator('section.pb-20 > div > div.grid');
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await grid.screenshot({ path: `${DIR}/08-cards-listagem.png` });
  });
});
