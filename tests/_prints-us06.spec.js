/* Captura de telas da US06 — CRUD de bandas e palestrantes. Não é teste de
   comportamento: monta o cenário e salva as imagens em docs/img/us06.

   Desligado por padrão. Para regerar:

       PRINTS=1 npx playwright test tests/_prints-us06.spec.js
*/
import { test } from './helpers/testWithCoverage.js';
import { loginAsAdmin } from './helpers/adminAuth';
import { setupApiMock } from './helpers/apiMock';

const DIR = 'docs/img/us06';

const pad = (n) => String(n).padStart(2, '0');
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noMesSeguinte = (dia) => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
};

/* O catálogo mostra os três casos de função, incluindo um cadastro antigo com
   profissão fora da lista ("Líder"). */
const CONVIDADOS = [
  {
    participante_id: 1,
    nome: 'Pr. Samuel Tavares',
    profissao: 'Pregador',
    link_foto: '',
    mini_bio: 'Diretor Nacional de Jovens e pastor há 18 anos.',
    redes_sociais: [{ rede: 'Instagram', url: 'instagram.com/prsamuel' }],
  },
  {
    participante_id: 2,
    nome: 'Adoração Viva',
    profissao: 'Banda',
    link_foto: '',
    mini_bio: 'Ministério de louvor da região centro-oeste.',
    redes_sociais: [
      { rede: 'Instagram', url: 'instagram.com/adoracaoviva' },
      { rede: 'Spotify', url: 'spotify.com/adoracaoviva' },
    ],
  },
  { participante_id: 3, nome: 'Pra. Raquel Gomes', profissao: 'Pregador', link_foto: '' },
  { participante_id: 4, nome: 'Mariley Ribeiro', profissao: 'Líder', link_foto: '' },
];

const EVENTOS = [
  {
    evento_id: 1,
    nome: 'Conferência Nacional',
    descricao: 'Três dias de conferência com convidados de todas as regiões.',
    tipo_evento: 'Conferência',
    data_inicio: `${chave(noMesSeguinte(12))}T08:00:00`,
    data_fim: `${chave(noMesSeguinte(12))}T18:00:00`,
    nome_local: 'Sede Nacional',
    local_latitude: -15.7934,
    local_longitude: -47.8822,
    link_galeria: '',
    formulario_link: '',
    link_imagem: '',
    calendario_evento_id: null,
  },
];

function criarEstado() {
  return {
    convidados: CONVIDADOS.map((c) => ({ ...c })),
    /* Samuel e a banda já estão na conferência: é o reaproveitamento em uso. */
    vinculos: { 1: [1, 2] },
    proximoId: 100,
  };
}

async function serveConvidados(page, estado) {
  await page.route('**/banda-palestrante**', async (route) => {
    const req = route.request();
    const url = req.url();

    if (req.method() === 'GET' && /\/banda-palestrante\/?(\?.*)?$/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(estado.convidados),
      });
    }
    if (req.method() === 'POST') {
      const corpo = JSON.parse(req.postData() || '{}');
      const novo = { ...corpo, participante_id: ++estado.proximoId };
      estado.convidados.push(novo);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(novo),
      });
    }
    const porId = url.match(/\/banda-palestrante\/(\d+)/);
    if (porId && req.method() === 'GET') {
      const alvo = estado.convidados.find((c) => c.participante_id === Number(porId[1]));
      return route.fulfill({
        status: alvo ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(alvo || {}),
      });
    }
    return route.fallback();
  });
}

async function serveEventos(page, estado) {
  await page.route('**/evento**', async (route) => {
    const req = route.request();
    const url = req.url();

    const participantes = url.match(/\/evento\/(\d+)\/participantes(?:\/(\d+))?/);
    if (participantes) {
      const eventoId = Number(participantes[1]);
      const participanteId = participantes[2] ? Number(participantes[2]) : null;
      estado.vinculos[eventoId] = estado.vinculos[eventoId] || [];

      if (req.method() === 'GET') {
        const ids = estado.vinculos[eventoId];
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(estado.convidados.filter((c) => ids.includes(c.participante_id))),
        });
      }
      if (req.method() === 'POST') {
        if (!estado.vinculos[eventoId].includes(participanteId)) {
          estado.vinculos[eventoId].push(participanteId);
        }
        return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      }
      if (req.method() === 'DELETE') {
        estado.vinculos[eventoId] = estado.vinculos[eventoId].filter((i) => i !== participanteId);
        return route.fulfill({ status: 204, body: '' });
      }
    }

    if (req.method() === 'GET' && /\/evento\/?(\?.*)?$/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EVENTOS),
      });
    }
    const porId = url.match(/\/evento\/(\d+)(\?.*)?$/);
    if (req.method() === 'GET' && porId) {
      const ev = EVENTOS.find((e) => String(e.evento_id) === porId[1]);
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

const cartao = (page, titulo) =>
  page
    .locator('div.rounded-2xl')
    .filter({ has: page.getByRole('heading', { name: titulo }) })
    .first();

test.describe('prints da US06', () => {
  test.skip(!process.env.PRINTS, 'defina PRINTS=1 para regerar as capturas');
  test.use({ viewport: { width: 1280, height: 900 } });

  let estado;

  test.beforeEach(async ({ page }) => {
    estado = criarEstado();
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveConvidados(page, estado);
    await serveEventos(page, estado);
  });

  test('listagem de convidados', async ({ page }) => {
    await page.goto('/admin/palestrantes');
    await page.getByText('Pr. Samuel Tavares').waitFor();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${DIR}/01-listagem.png` });
  });

  test('busca por função', async ({ page }) => {
    await page.goto('/admin/palestrantes');
    await page.getByText('Pr. Samuel Tavares').waitFor();
    await page.getByLabel('Buscar convidado').fill('banda');
    await page.waitForTimeout(400);

    const lista = page
      .locator('div.rounded-2xl')
      .filter({ has: page.getByLabel('Buscar convidado') })
      .first();
    await lista.screenshot({ path: `${DIR}/02-busca.png` });
  });

  test('formulário de cadastro', async ({ page }) => {
    await page.goto('/admin/palestrantes/criar');
    await page.locator('input[name="name"]').waitFor();

    await page.fill('input[name="name"]', 'Banda Nova Aliança');
    await page.selectOption('select[name="role"]', 'Banda');
    await page.fill(
      'textarea[name="miniBio"]',
      'Ministério de louvor da região sul, formado em 2019.'
    );
    await page.getByLabel('Rede 1', { exact: true }).fill('Instagram');
    await page.getByLabel('Endereço da rede 1').fill('instagram.com/novaalianca');
    await page.waitForTimeout(400);

    await page.locator('form').screenshot({ path: `${DIR}/03-cadastro.png` });
  });

  test('seleção de convidados no formulário do evento', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByText('Pr. Samuel Tavares').waitFor();
    await page.getByLabel('Buscar convidado para o evento').fill('ra');
    await page.waitForTimeout(500);

    const bloco = page
      .locator('div.mb-1')
      .filter({ has: page.getByRole('link', { name: 'Gerenciar convidados' }) })
      .first();
    await bloco.screenshot({ path: `${DIR}/04-selecao-no-evento.png` });
  });

  test('cadastro rápido dentro do formulário do evento', async ({ page }) => {
    await page.goto('/admin/eventos/1/editar');
    await page.getByText('Pr. Samuel Tavares').waitFor();
    await page.getByRole('button', { name: /Cadastrar convidado novo/ }).click();
    await page.getByLabel('Nome do novo convidado').fill('Pr. Convidado Surpresa');
    await page.waitForTimeout(400);

    const bloco = page
      .locator('div.mb-1')
      .filter({ has: page.getByRole('link', { name: 'Gerenciar convidados' }) })
      .first();
    await bloco.screenshot({ path: `${DIR}/05-cadastro-rapido.png` });
  });

  test('convidados na tela de detalhe do evento', async ({ page }) => {
    await page.goto('/admin/eventos/1');
    await page.getByText('Pr. Samuel Tavares').first().waitFor();
    await page.waitForTimeout(500);

    await cartao(page, 'Convidados').screenshot({ path: `${DIR}/06-detalhe-do-evento.png` });
  });

  test('aviso ao excluir convidado vinculado', async ({ page }) => {
    await page.goto('/admin/palestrantes');
    await page.getByText('Pr. Samuel Tavares').waitFor();
    await page.getByTitle('Excluir').first().click();
    await page.getByText(/vinculado a/).waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/07-exclusao-com-aviso.png` });
  });

  test('página pública com os grupos separados', async ({ page }) => {
    await page.goto('/eventos/1-conferencia-nacional');
    await page.getByRole('heading', { name: 'Bandas' }).waitFor();
    await page.waitForTimeout(600);

    const secao = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Palestrantes' }),
    });
    await secao.screenshot({ path: `${DIR}/08-pagina-publica.png` });
  });
});
