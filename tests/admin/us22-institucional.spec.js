import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin, loginComPapeis } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* US22 (painel): a superadministradora edita missão, visão e valores, e o
   texto aparece na página "Quem somos". Administrador de setor não vê a tela. */

const menu = (page) => page.getByRole('navigation').getByRole('link');

function capturarPut(page) {
  return page.waitForRequest(
    (req) => req.method() === 'PUT' && /\/institucional\/?$/.test(new URL(req.url()).pathname)
  );
}

test.describe('US22 - Edição de missão, visão e valores', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('a superadministradora vê o item no menu e abre a tela', async ({ page }) => {
    await page.goto('/admin');
    await menu(page).filter({ hasText: 'Missão e valores' }).click();

    await expect(page).toHaveURL(/\/admin\/institucional$/);
    await expect(page.getByRole('heading', { name: 'Missão, visão e valores' })).toBeVisible();
  });

  test('sem nada salvo, o formulário traz a missão do rodapé e avisa', async ({ page }) => {
    await page.goto('/admin/institucional');

    await expect(page.getByText('Ainda não há conteúdo salvo.')).toBeVisible();
    await expect(page.getByLabel('Missão')).toHaveValue(/Inspirar e capacitar as novas gerações/);
    await expect(page.getByLabel('Visão')).toHaveValue('');
    await expect(page.getByLabel('Valor 1', { exact: true })).toHaveValue('');
  });

  test('o conteúdo já salvo vem preenchido', async ({ page }) => {
    await page.route(/^https?:\/\/[^/]+\/institucional\/?$/, (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ missao: 'Missão salva', visao: 'Visão salva', valores: ['Fé', 'Serviço'] }),
      });
    });
    await page.goto('/admin/institucional');

    await expect(page.getByLabel('Missão')).toHaveValue('Missão salva');
    await expect(page.getByLabel('Visão')).toHaveValue('Visão salva');
    await expect(page.getByLabel('Valor 1', { exact: true })).toHaveValue('Fé');
    await expect(page.getByLabel('Valor 2', { exact: true })).toHaveValue('Serviço');
    await expect(page.getByText('Ainda não há conteúdo salvo.')).toHaveCount(0);
  });

  test('salvar envia o conteúdo e a página pública passa a mostrar', async ({ page }) => {
    await page.goto('/admin/institucional');

    await page.getByLabel('Missão').fill('  Nova missão do IDB Jovem.  ');
    await page.getByLabel('Visão').fill('Nova visão.');
    await page.getByLabel('Valor 1', { exact: true }).fill('Fé');
    await page.getByRole('button', { name: 'Adicionar valor' }).click();
    await page.getByLabel('Valor 2', { exact: true }).fill('Comunhão');
    await page.getByRole('button', { name: 'Adicionar valor' }).click();
    await page.getByLabel('Valor 3', { exact: true }).fill('Apagar este');
    await page.getByRole('button', { name: 'Remover valor 3' }).click();
    await page.getByRole('button', { name: 'Adicionar valor' }).click(); // fica em branco

    const put = capturarPut(page);
    await page.getByRole('button', { name: 'Salvar' }).click();
    const corpo = (await put).postDataJSON();

    /* Espaços aparados e valor em branco descartado. */
    expect(corpo).toEqual({ missao: 'Nova missão do IDB Jovem.', visao: 'Nova visão.', valores: ['Fé', 'Comunhão'] });
    await expect(page.getByRole('status')).toContainText('Missão, visão e valores salvos.');

    await page.goto('/quem-somos');
    await expect(page.getByRole('region', { name: 'Missão' })).toContainText('Nova missão do IDB Jovem.');
    await expect(page.getByRole('region', { name: 'Visão' })).toContainText('Nova visão.');
    await expect(page.getByRole('region', { name: 'Valores' }).getByRole('listitem')).toHaveCount(2);
  });

  test('remover o único valor deixa um campo vazio no lugar', async ({ page }) => {
    await page.goto('/admin/institucional');
    await page.getByLabel('Valor 1', { exact: true }).fill('Fé');
    await page.getByRole('button', { name: 'Remover valor 1' }).click();
    await expect(page.getByLabel('Valor 1', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Valor 2', { exact: true })).toHaveCount(0);
  });

  test('tudo em branco não é enviado', async ({ page }) => {
    await page.goto('/admin/institucional');
    await page.getByLabel('Missão').fill('');

    let enviou = false;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && /\/institucional/.test(req.url())) enviou = true;
    });
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Preencha ao menos a missão, a visão ou um valor.');
    expect(enviou).toBe(false);
  });

  test('servidor sem a rota avisa que o cadastro ainda não existe', async ({ page }) => {
    await page.route(/^https?:\/\/[^/]+\/institucional\/?$/, (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{"detail":"Not Found"}' });
    });
    await page.goto('/admin/institucional');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByRole('alert')).toHaveText('O servidor ainda não oferece o cadastro deste conteúdo.');
  });

  test('recusa de permissão é explicada', async ({ page }) => {
    await page.route(/^https?:\/\/[^/]+\/institucional\/?$/, (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      return route.fulfill({ status: 403, contentType: 'application/json', body: '{"detail":"Forbidden"}' });
    });
    await page.goto('/admin/institucional');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Apenas a superadministradora pode alterar este conteúdo.');
  });

  test('enquanto salva, o botão fica travado', async ({ page }) => {
    let liberar;
    const espera = new Promise((resolve) => { liberar = resolve; });
    await page.route(/^https?:\/\/[^/]+\/institucional\/?$/, async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      await espera;
      return route.fallback();
    });
    await page.goto('/admin/institucional');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
    liberar();
    await expect(page.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });
});

test.describe('US22 - Acesso restrito à superadministradora', () => {
  test('administrador de setor não vê o item nem abre a tela', async ({ page }) => {
    await loginComPapeis(page, ['admin', 'admin-eventos']);
    await setupApiMock(page);

    await page.goto('/admin');
    await expect(menu(page).filter({ hasText: 'Eventos' }).first()).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Missão e valores' })).toHaveCount(0);

    await page.goto('/admin/institucional');
    await expect(page).toHaveURL(/\/unauthorized$/);
  });
});
