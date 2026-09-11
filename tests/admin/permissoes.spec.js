import { test, expect } from '../helpers/testWithCoverage.js';
import { loginComPapeis, KEYCLOAK_ID_DE_TESTE } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* Perfis da US03. */
const SUPERADMIN = ['admin', 'superadmin'];
const ADMIN_EVENTOS = ['admin', 'admin-eventos'];
const ADMIN_PRODUTOS = ['admin', 'admin-produtos'];
const ADMIN_INSCRICOES = ['admin', 'admin-inscricoes'];
const ADMIN_SEM_SETOR = ['admin'];
const SEM_PAPEL = ['offline_access'];

const menu = (page) => page.getByRole('navigation').getByRole('link');

test.describe('Menu do painel por setor', () => {
  test('superadministradora vê todos os setores e os administradores', async ({ page }) => {
    await loginComPapeis(page, SUPERADMIN);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(menu(page).filter({ hasText: 'Eventos' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Produtos' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Voluntários' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Administradores' })).toBeVisible();
  });

  test('administrador de produtos vê só o seu setor', async ({ page }) => {
    await loginComPapeis(page, ADMIN_PRODUTOS);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(menu(page).filter({ hasText: 'Produtos' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Eventos' })).toHaveCount(0);
    await expect(menu(page).filter({ hasText: 'Voluntários' })).toHaveCount(0);
  });

  test('administrador comum não vê o item de administradores', async ({ page }) => {
    await loginComPapeis(page, ADMIN_EVENTOS);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(menu(page).filter({ hasText: 'Eventos' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Administradores' })).toHaveCount(0);
  });

  test('administrador de dois setores vê os dois', async ({ page }) => {
    await loginComPapeis(page, ['admin', 'admin-eventos', 'admin-inscricoes']);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(menu(page).filter({ hasText: 'Eventos' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Voluntários' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Produtos' })).toHaveCount(0);
  });

  test('admin sem papel de setor continua vendo tudo', async ({ page }) => {
    /* Compatibilidade: enquanto o Keycloak não emitir os papéis novos,
       ninguém perde o painel. */
    await loginComPapeis(page, ADMIN_SEM_SETOR);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(menu(page).filter({ hasText: 'Eventos' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Produtos' })).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Voluntários' })).toBeVisible();
  });
});

test.describe('Guarda de rota por setor', () => {
  test('administrador de produtos não abre a agenda de eventos', async ({ page }) => {
    await loginComPapeis(page, ADMIN_PRODUTOS);
    await setupApiMock(page);
    await page.goto('/admin/eventos');

    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.getByRole('heading', { name: 'Acesso Negado' })).toBeVisible();
  });

  test('a tela de acesso negado leva ao setor que a pessoa administra', async ({ page }) => {
    await loginComPapeis(page, ADMIN_PRODUTOS);
    await setupApiMock(page);
    await page.goto('/admin/eventos');

    /* Não pede login de novo: a pessoa já está autenticada. */
    await expect(page.getByRole('link', { name: /Ir para Login/i })).toHaveCount(0);

    const atalho = page.getByRole('link', { name: 'Loja e Produtos' });
    await expect(atalho).toBeVisible();
    await atalho.click();
    await expect(page).toHaveURL(/\/admin\/produtos/);
  });

  test('administrador de eventos não abre a listagem de produtos', async ({ page }) => {
    await loginComPapeis(page, ADMIN_EVENTOS);
    await setupApiMock(page);
    await page.goto('/admin/produtos');

    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test('administrador de inscrições não abre eventos nem produtos', async ({ page }) => {
    await loginComPapeis(page, ADMIN_INSCRICOES);
    await setupApiMock(page);

    await page.goto('/admin/eventos');
    await expect(page).toHaveURL(/\/unauthorized/);

    await page.goto('/admin/produtos');
    await expect(page).toHaveURL(/\/unauthorized/);

    await page.goto('/admin/voluntarios');
    await expect(page).toHaveURL(/\/admin\/voluntarios/);
  });

  test('administrador comum não abre a tela de administradores', async ({ page }) => {
    await loginComPapeis(page, ADMIN_EVENTOS);
    await setupApiMock(page);
    await page.goto('/admin/administradores');

    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test('quem não é administrador vai para acesso negado, não para o login', async ({ page }) => {
    await loginComPapeis(page, SEM_PAPEL);
    await setupApiMock(page);
    await page.goto('/admin/eventos');

    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(
      page.getByText(/não administra nenhum setor/i)
    ).toBeVisible();
  });
});

test.describe('Exclusão restrita ao superadministrador', () => {
  test('administrador de eventos não recebe o botão de excluir evento', async ({ page }) => {
    await loginComPapeis(page, ADMIN_EVENTOS);
    await setupApiMock(page);
    await page.goto('/admin/eventos');

    await expect(page.getByRole('heading', { name: 'Próximos Eventos' })).toBeVisible();
    await expect(page.getByTitle('Excluir')).toHaveCount(0);
    /* Editar continua disponível: o setor cria e edita, mas não apaga. */
    await expect(page.getByTitle('Editar').first()).toBeVisible();
  });

  test('superadministradora recebe o botão de excluir evento', async ({ page }) => {
    await loginComPapeis(page, SUPERADMIN);
    await setupApiMock(page);
    await page.goto('/admin/eventos');

    await expect(page.getByTitle('Excluir').first()).toBeVisible();
  });

  test('administrador de produtos cadastra e edita, mas não exclui', async ({ page }) => {
    await loginComPapeis(page, ADMIN_PRODUTOS);
    await setupApiMock(page);
    await page.goto('/admin/produtos');

    /* Antes da US03 estas duas ações exigiam superadmin, o que impediria o
       administrador da loja de fazer o próprio trabalho. */
    await expect(page.getByRole('link', { name: /Cadastrar Produto/i })).toBeVisible();
    await page.goto('/admin/produtos/criar');
    await expect(page).toHaveURL(/\/admin\/produtos\/criar/);
  });

  test('o serviço recusa a exclusão mesmo sem passar pela tela', async ({ page }) => {
    await loginComPapeis(page, ADMIN_EVENTOS);
    await setupApiMock(page);
    await page.goto('/admin/eventos');
    await expect(page.getByRole('heading', { name: 'Próximos Eventos' })).toBeVisible();

    /* Esconder o botão não pode ser a única barreira: a chamada direta ao
       serviço também é recusada, antes de sair para a API. */
    let chamouApi = false;
    await page.route('**/evento/*', (route) => {
      if (route.request().method() === 'DELETE') chamouApi = true;
      return route.fallback();
    });

    const resultado = await page.evaluate(async () => {
      const mod = await import('/src/services/eventService.js');
      return mod.handleDeleteEvent(1);
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('superadministradora');
    expect(chamouApi).toBe(false);
  });
});

/* A pessoa logada nos testes e uma colega, para exercitar a trava de não
   remover o próprio acesso. */
const ADMINS = [
  { admin_id: 1, nome: 'Raquel Gomes', email: 'raquel@idb.org', keycloak_id: KEYCLOAK_ID_DE_TESTE },
  { admin_id: 2, nome: 'Samuel Tavares', email: 'samuel@idb.org', keycloak_id: 'outro-id' },
];

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

test.describe('Tela de administradores', () => {
  test.beforeEach(async ({ page }) => {
    await loginComPapeis(page, SUPERADMIN);
    await setupApiMock(page);
  });

  test('lista os administradores e oferece o cadastro', async ({ page }) => {
    await serveAdmins(page, ADMINS);
    await page.goto('/admin/administradores');

    await expect(page.getByRole('heading', { name: 'Administradores' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Adicionar Administrador/i })).toBeVisible();
    await expect(page.getByText('Raquel Gomes')).toBeVisible();
    await expect(page.getByText('samuel@idb.org')).toBeVisible();
    /* A tela não inventa setor de terceiros: ela diz onde isso é definido. */
    await expect(page.getByText('Setores definidos no Keycloak')).toBeVisible();
  });

  test('não deixa a superadministradora remover o próprio acesso', async ({ page }) => {
    await serveAdmins(page, ADMINS);
    await page.goto('/admin/administradores');
    await expect(page.getByText('Raquel Gomes')).toBeVisible();

    /* A própria linha vem marcada e com a remoção desativada — perder o próprio
       acesso não teria como ser desfeito pelo painel. */
    await expect(page.getByText('você', { exact: true })).toBeVisible();
    await expect(
      page.getByTitle('Você não pode remover o seu próprio acesso')
    ).toBeDisabled();

    /* A colega segue removível. */
    await expect(page.getByTitle('Remover administrador')).toBeEnabled();
  });

  test('o formulário pede nome, e-mail e o ID do Keycloak', async ({ page }) => {
    await page.goto('/admin/administradores/criar');

    await expect(page.getByRole('heading', { name: 'Novo Administrador' })).toBeVisible();
    await expect(page.locator('input[name="nome"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="keycloakId"]')).toBeVisible();
    /* A tela não atribui setor — ela explica onde isso é definido. */
    await expect(page.getByText(/vêm dos papéis dela no Keycloak/i)).toBeVisible();
  });
});
