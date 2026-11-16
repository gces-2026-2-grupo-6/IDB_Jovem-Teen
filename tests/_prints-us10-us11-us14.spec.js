/* Captura de telas das US10, US11 e US14. Não é teste de comportamento: monta
   o cenário e salva as imagens em docs/img/US10-US11-US14, para a
   apresentação.

   Desligado por padrão. Para regerar:

       PRINTS=1 npx playwright test tests/_prints-us10-us11-us14.spec.js
*/
import { test } from './helpers/testWithCoverage.js';
import { loginAsAdmin } from './helpers/adminAuth';
import { setupApiMock } from './helpers/apiMock';

const DIR = 'docs/img/US10-US11-US14';

const pad = (n) => String(n).padStart(2, '0');
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noMesSeguinte = (dia) => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
};

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/* Três eventos: um ativo, um cancelado e um adiado com nova data — é o que
   mostra o aviso da US14 nas telas públicas sem precisar marcar nada na hora. */
const EVENTOS = [
  {
    evento_id: 1,
    nome: 'Conferência Nacional',
    descricao: 'Três dias reunindo jovens e adolescentes de todas as regiões.',
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
    situacao: 'ativo',
    nova_data: null,
  },
  {
    evento_id: 2,
    nome: 'Acampamento de Verão',
    descricao: 'Fim de semana de acampamento no litoral.',
    tipo_evento: 'Acampamento',
    data_inicio: `${chave(noMesSeguinte(20))}T08:00:00`,
    data_fim: `${chave(noMesSeguinte(22))}T18:00:00`,
    datas: null,
    nome_local: 'Camping Serra Azul',
    local_latitude: -15.78,
    local_longitude: -47.93,
    link_galeria: '',
    formulario_link: 'https://forms.gle/acampamento-voluntarios',
    formulario_participante_link: 'https://forms.gle/acampamento-participantes',
    link_imagem: '',
    calendario_evento_id: null,
    situacao: 'cancelado',
    nova_data: null,
  },
  {
    evento_id: 3,
    nome: 'Encontro de Líderes',
    descricao: 'Dia de formação para a diretoria regional.',
    tipo_evento: 'Outros',
    data_inicio: `${chave(noMesSeguinte(27))}T09:00:00`,
    data_fim: `${chave(noMesSeguinte(27))}T17:00:00`,
    datas: null,
    nome_local: 'Templo Central',
    local_latitude: -15.7801,
    local_longitude: -47.9292,
    link_galeria: '',
    formulario_link: '',
    formulario_participante_link: 'https://forms.gle/encontro-participantes',
    link_imagem: '',
    calendario_evento_id: null,
    situacao: 'adiado',
    nova_data: '2027-04-10T09:00:00',
  },
];

const MATERIAIS = [
  {
    material_id: 1,
    titulo: 'Manual do Líder 2026',
    descricao: 'Guia de orientação para a diretoria, em versão de impressão.',
    tipo: 'documento',
    link: 'https://drive.google.com/file/d/manual/view',
    url_download: 'http://api.test/drive/download/manual',
    criado_em: '2026-10-26T19:18:29Z',
  },
  {
    material_id: 2,
    titulo: 'Vídeo institucional',
    descricao: 'Apresentação do IDB Jovem & Teen para igrejas locais.',
    tipo: 'video',
    link: 'https://youtube.com/watch?v=institucional',
    url_download: 'https://youtube.com/watch?v=institucional',
    criado_em: '2026-10-22T10:00:00Z',
  },
  {
    material_id: 3,
    titulo: 'Identidade visual',
    descricao: 'Logotipo e cores oficiais, em alta resolução.',
    tipo: 'foto',
    link: 'https://drive.google.com/file/d/identidade/view',
    url_download: 'http://api.test/drive/download/identidade',
    criado_em: '2026-10-20T10:00:00Z',
  },
  {
    material_id: 4,
    titulo: 'Devocional de Novembro',
    descricao: 'Material de estudo para os encontros semanais.',
    tipo: 'documento',
    link: 'https://drive.google.com/file/d/devocional/view',
    url_download: 'http://api.test/drive/download/devocional',
    criado_em: '2026-10-18T10:00:00Z',
  },
];

const LINKS_PAINEL = {
  link_cadastro_lideres: 'https://forms.gle/cadastro-nacional-lideres',
  link_planilha_lideres: 'https://docs.google.com/spreadsheets/d/respostas-lideres',
};

// Os padrões abaixo exigem a origem da API e o caminho inteiro. Um glob solto
// como "**/material**" também casaria com o módulo
// /src/services/materialService.js que o Vite serve, e a página receberia JSON
// no lugar do JavaScript — a tela não carregaria.
const ROTA_PAINEL = /^https?:\/\/[^/]+\/painel\/links$/;
const ROTA_MATERIAL = /^https?:\/\/[^/]+\/material\/?(\?.*)?$/;
const ROTA_EVENTO = /^https?:\/\/[^/]+\/evento(\/|\?|$)/;

async function serveCenario(page) {
  await page.route(ROTA_PAINEL, (route) => route.fulfill(json(LINKS_PAINEL)));

  await page.route(ROTA_MATERIAL, (route) => {
    const tipo = new URL(route.request().url()).searchParams.get('tipo');
    const lista = tipo ? MATERIAIS.filter((m) => m.tipo === tipo) : MATERIAIS;
    return route.fulfill(json(lista));
  });

  await page.route(ROTA_EVENTO, async (route) => {
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

test.describe('prints das US10, US11 e US14', () => {
  test.skip(!process.env.PRINTS, 'defina PRINTS=1 para regerar as capturas');
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await serveCenario(page);
  });

  /* ---------------------------- US10 ---------------------------- */

  test('US10: os dois links fixados na página inicial do painel', async ({ page }) => {
    await page.goto('/admin');
    await page.getByTestId('links-lideres').waitFor();
    await page.waitForTimeout(600);

    await page.getByTestId('links-lideres').screenshot({ path: `${DIR}/us10-01-links-painel.png` });
  });

  test('US10: troca do endereço no próprio card', async ({ page }) => {
    await page.goto('/admin');
    await page.getByTestId('link-planilha').waitFor();
    await page.getByTestId('link-planilha').getByRole('button', { name: 'Trocar' }).click();
    await page.waitForTimeout(400);

    await page.getByTestId('links-lideres').screenshot({ path: `${DIR}/us10-02-trocar-link.png` });
  });

  test('US10: cargo já ocupado é recusado com explicação', async ({ page }) => {
    await page.goto('/admin/lideres/criar');
    await page.getByPlaceholder('Nome do diretor/líder').fill('Novo Diretor Nacional');
    await page
      .getByPlaceholder('Ex.: Diretora Nacional de Adolescentes')
      .fill('Diretor Nacional de Jovens');
    await page.locator('select[name="region"]').selectOption('Nacional');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await page.getByRole('alert').waitFor();
    await page.getByRole('alert').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/us10-03-cargo-ocupado.png` });
  });

  /* ---------------------------- US11 ---------------------------- */

  test('US11: área pública de materiais', async ({ page }) => {
    await page.goto('/materiais');
    await page.getByRole('heading', { name: 'Manual do Líder 2026' }).waitFor();
    await page.waitForTimeout(700);

    await page.screenshot({ path: `${DIR}/us11-01-area-publica.png` });
  });

  test('US11: filtro por tipo de material', async ({ page }) => {
    await page.goto('/materiais');
    await page.getByRole('button', { name: 'Documentos' }).click();
    await page.getByRole('heading', { name: 'Manual do Líder 2026' }).waitFor();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${DIR}/us11-02-filtro-tipo.png` });
  });

  test('US11: painel de materiais da superadministradora', async ({ page }) => {
    await page.goto('/admin/materiais');
    await page.getByText('Manual do Líder 2026').waitFor();
    await page.waitForTimeout(600);

    await page.screenshot({ path: `${DIR}/us11-03-painel-materiais.png` });
  });

  test('US11: cadastro de material', async ({ page }) => {
    await page.goto('/admin/materiais/criar');
    await page.getByLabel('Título').fill('Devocional de Dezembro');
    await page.getByLabel('Link do arquivo').fill('https://drive.google.com/file/d/devocional-dez/view');
    await page.getByLabel('Descrição (opcional)').fill('Material de estudo para os encontros semanais.');
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/us11-04-cadastro-material.png` });
  });

  test('US11: download em cada foto da galeria do evento', async ({ page }) => {
    await page.route(/^https?:\/\/[^/]+\/evento\/1\/galeria$/, (route) =>
      route.fulfill(
        json([
          { id: 'g1', nome: 'abertura.jpg', url_visualizacao: '/logo.svg', url_download: 'http://api.test/drive/download/g1' },
          { id: 'g2', nome: 'louvor.jpg', url_visualizacao: '/logo.svg', url_download: 'http://api.test/drive/download/g2' },
          { id: 'g3', nome: 'plenaria.jpg', url_visualizacao: '/logo.svg', url_download: 'http://api.test/drive/download/g3' },
          { id: 'g4', nome: 'encerramento.jpg', url_visualizacao: '/logo.svg', url_download: 'http://api.test/drive/download/g4' },
        ])
      )
    );

    await page.goto('/eventos/1-conferencia-nacional');
    const galeria = page.locator('section').filter({ hasText: 'Galeria do evento' });
    await galeria.waitFor();
    await galeria.scrollIntoViewIfNeeded();
    /* O botão só aparece no hover em tela grande; o foco o traz para a captura. */
    await galeria.getByRole('link', { name: /^Baixar / }).first().focus();
    await page.waitForTimeout(500);

    await galeria.screenshot({ path: `${DIR}/us11-05-galeria-download.png` });
  });

  /* ---------------------------- US14 ---------------------------- */

  test('US14: marcação da situação no painel', async ({ page }) => {
    await page.goto('/admin/eventos/2/editar');
    await page.getByRole('heading', { name: 'Situação do evento' }).waitFor();
    await page.waitForTimeout(500);

    const card = page.locator('div').filter({ hasText: 'Situação do evento' }).last();
    await card.screenshot({ path: `${DIR}/us14-01-marcar-situacao.png` });
  });

  test('US14: adiamento com a nova data', async ({ page }) => {
    await page.goto('/admin/eventos/3/editar');
    await page.getByRole('heading', { name: 'Situação do evento' }).waitFor();
    await page.getByRole('button', { name: 'Adiado' }).click();
    await page.waitForTimeout(400);

    const card = page.locator('div').filter({ hasText: 'Situação do evento' }).last();
    await card.screenshot({ path: `${DIR}/us14-02-adiado-nova-data.png` });
  });

  test('US14: aviso na página do evento, sem botão de inscrição', async ({ page }) => {
    await page.goto('/eventos/2-acampamento-de-verao');
    await page.getByRole('status').first().waitFor();
    await page.waitForTimeout(600);

    const hero = page.locator('section').first();
    await hero.screenshot({ path: `${DIR}/us14-03-evento-cancelado.png` });
  });

  test('US14: agenda com o evento cancelado e o adiado', async ({ page }) => {
    await page.goto('/eventos');
    await page.getByRole('heading', { name: 'Conferência Nacional' }).first().waitFor();
    await page.waitForTimeout(800);

    const grid = page.locator('section.pb-20 > div > div.grid');
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await grid.screenshot({ path: `${DIR}/us14-04-agenda-avisos.png` });
  });

  test('US14: selo na lista do painel', async ({ page }) => {
    await page.goto('/admin/eventos');
    await page.getByText('Acampamento de Verão').waitFor();
    await page.waitForTimeout(600);

    await page.screenshot({ path: `${DIR}/us14-05-lista-painel.png` });
  });
});
