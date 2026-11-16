/* Captura de telas da US03 — administrador por setor. Não é teste de
   comportamento: monta cada perfil de permissão e salva as imagens em
   docs/img/us03.

   Fica desligado por padrão, para não rodar na suíte nem reescrever as imagens
   em CI. Para regerar:

       PRINTS=1 npx playwright test tests/_prints-us03.spec.js
*/
import { test } from './helpers/testWithCoverage.js';
import { loginComPapeis, KEYCLOAK_ID_DE_TESTE } from './helpers/adminAuth';
import { setupApiMock } from './helpers/apiMock';

const DIR = 'docs/img/us03';

const SUPERADMIN = ['admin', 'superadmin'];
const ADMIN_EVENTOS = ['admin', 'admin-eventos'];
const ADMIN_PRODUTOS = ['admin', 'admin-produtos'];
const ADMIN_INSCRICOES = ['admin', 'admin-inscricoes'];

const pad = (n) => String(n).padStart(2, '0');
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noMesSeguinte = (dia) => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
};

function evento({ id, nome, dia, local }) {
  const data = noMesSeguinte(dia);
  return {
    evento_id: id,
    nome,
    descricao: 'Evento de demonstração.',
    tipo_evento: 'Conferência',
    data_inicio: `${chave(data)}T08:00:00`,
    data_fim: `${chave(data)}T18:00:00`,
    datas: null,
    nome_local: local,
    local_latitude: -15.7934,
    local_longitude: -47.8822,
    link_galeria: '',
    formulario_link: '',
    link_imagem: '',
    calendario_evento_id: null,
  };
}

const EVENTOS = [
  evento({ id: 1, nome: 'Conferência Nacional', dia: 12, local: 'Sede Nacional' }),
  evento({ id: 2, nome: 'Culto de Celebração', dia: 27, local: 'Templo Central' }),
];

const ADMINS = [
  {
    admin_id: 1,
    nome: 'Raquel Gomes',
    email: 'raquel@idbjovem.org',
    keycloak_id: KEYCLOAK_ID_DE_TESTE,
  },
  { admin_id: 2, nome: 'Samuel Tavares', email: 'samuel@idbjovem.org', keycloak_id: 'id-2' },
  { admin_id: 3, nome: 'Mariley Ribeiro', email: 'mariley@idbjovem.org', keycloak_id: 'id-3' },
];

async function serveEvents(page, eventos) {
  await page.route('**/evento**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && /\/evento\/?(\?.*)?$/.test(req.url())) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(eventos),
      });
    }
    return route.fallback();
  });
}

async function serveAdmins(page, admins) {
  await page.route('**/admin/**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && /\/admin\/?(\?.*)?$/.test(req.url())) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(admins),
      });
    }
    return route.fallback();
  });
}

const menuLateral = (page) => page.locator('aside').first();

const cardProximosEventos = (page) =>
  page
    .locator('div.rounded-2xl')
    .filter({ has: page.getByRole('heading', { name: 'Próximos Eventos' }) })
    .first();

test.describe('prints da US03', () => {
  test.skip(!process.env.PRINTS, 'defina PRINTS=1 para regerar as capturas');
  test.use({ viewport: { width: 1280, height: 900 } });

  test('menu da superadministradora', async ({ page }) => {
    await loginComPapeis(page, SUPERADMIN);
    await setupApiMock(page);
    await serveEvents(page, EVENTOS);
    await page.goto('/admin');
    await page.getByRole('link', { name: 'Administradores' }).waitFor();
    await page.waitForTimeout(400);

    await menuLateral(page).screenshot({ path: `${DIR}/01-menu-superadmin.png` });
  });

  test('menu do administrador de produtos', async ({ page }) => {
    await loginComPapeis(page, ADMIN_PRODUTOS);
    await setupApiMock(page);
    await page.goto('/admin');
    await page.getByRole('link', { name: 'Produtos' }).waitFor();
    await page.waitForTimeout(400);

    await menuLateral(page).screenshot({ path: `${DIR}/02-menu-admin-produtos.png` });
  });

  test('menu de quem administra dois setores', async ({ page }) => {
    await loginComPapeis(page, ['admin', 'admin-eventos', 'admin-inscricoes']);
    await setupApiMock(page);
    await serveEvents(page, EVENTOS);
    await page.goto('/admin');
    /* Escopo no menu: "Voluntários" também aparece nos atalhos do painel. */
    await menuLateral(page).getByRole('link', { name: 'Voluntários' }).waitFor();
    await page.waitForTimeout(400);

    await menuLateral(page).screenshot({ path: `${DIR}/03-menu-dois-setores.png` });
  });

  test('acesso negado com atalho para o setor da pessoa', async ({ page }) => {
    await loginComPapeis(page, ADMIN_PRODUTOS);
    await setupApiMock(page);
    await page.goto('/admin/eventos');
    await page.getByRole('link', { name: 'Loja e Produtos' }).waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/04-acesso-negado.png` });
  });

  test('listagem de eventos sem o botão de excluir', async ({ page }) => {
    await loginComPapeis(page, ADMIN_EVENTOS);
    await setupApiMock(page);
    await serveEvents(page, EVENTOS);
    await page.goto('/admin/eventos');
    await page.getByRole('heading', { name: 'Próximos Eventos' }).waitFor();
    await page.waitForTimeout(400);

    await cardProximosEventos(page).screenshot({ path: `${DIR}/05-eventos-admin-setor.png` });
  });

  test('listagem de eventos com o botão de excluir', async ({ page }) => {
    await loginComPapeis(page, SUPERADMIN);
    await setupApiMock(page);
    await serveEvents(page, EVENTOS);
    await page.goto('/admin/eventos');
    await page.getByRole('heading', { name: 'Próximos Eventos' }).waitFor();
    await page.waitForTimeout(400);

    await cardProximosEventos(page).screenshot({ path: `${DIR}/06-eventos-superadmin.png` });
  });

  test('tela de administradores', async ({ page }) => {
    await loginComPapeis(page, SUPERADMIN);
    await setupApiMock(page);
    await serveAdmins(page, ADMINS);
    await page.goto('/admin/administradores');
    await page.getByText('Raquel Gomes').waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/07-administradores.png` });
  });

  test('formulário de novo administrador', async ({ page }) => {
    await loginComPapeis(page, SUPERADMIN);
    await setupApiMock(page);
    await page.goto('/admin/administradores/criar');
    await page.locator('input[name="keycloakId"]').waitFor();
    await page.waitForTimeout(400);

    await page.locator('form').screenshot({ path: `${DIR}/08-novo-administrador.png` });
  });

  test('painel de quem não administra eventos nem produtos', async ({ page }) => {
    await loginComPapeis(page, ADMIN_INSCRICOES);
    await setupApiMock(page);
    await page.goto('/admin');
    await page.getByText(/Use o menu ao lado/i).waitFor();
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/09-painel-sem-setor.png` });
  });
});
