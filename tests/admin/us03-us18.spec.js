import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin, loginComPapeis, mockKeycloakLogin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

/* US03 (revisão, CA1): produtos e eventos em telas separadas, cada uma com o
   seu item de menu. O painel inicial resume só a agenda; quem cuida apenas da
   loja entra direto na tela de Produtos.

   US18: a superadministradora exclui fotos específicas do álbum de um evento.
   Elas somem do site, a capa passa para a foto seguinte, os outros álbuns não
   mudam, e o arquivo no Drive não é alterado. */

const menu = (page) => page.getByRole('navigation').getByRole('link');

async function entrarComPapeis(page, papeis) {
  await setupApiMock(page);
  await mockKeycloakLogin(page, papeis);
  await page.goto('/login');
  await page.fill('input[name="usuario"]', 'idbjovem');
  await page.fill('input[name="senha"]', 'idbjovem');
  await page.getByRole('button', { name: 'Login' }).click();
}

test.describe('US03 - Produtos e eventos em telas separadas', () => {
  test('o painel inicial mostra a agenda e não os produtos', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Próximos Eventos' })).toBeVisible();
    await expect(page.getByText('Produtos Cadastrados')).toHaveCount(0);
    /* Cada setor tem o seu item de menu. */
    await expect(menu(page).filter({ hasText: 'Eventos' }).first()).toBeVisible();
    await expect(menu(page).filter({ hasText: 'Produtos' })).toBeVisible();
  });

  test('a tela de Produtos não traz eventos', async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/produtos');

    await expect(page.getByRole('heading', { name: 'Produtos', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Próximos Eventos' })).toHaveCount(0);
  });

  test('administrador só da loja entra direto na tela de Produtos', async ({ page }) => {
    await entrarComPapeis(page, ['admin', 'admin-produtos']);
    await expect(page).toHaveURL(/\/admin\/produtos$/);
  });

  test('administrador de eventos continua entrando no painel da agenda', async ({ page }) => {
    await entrarComPapeis(page, ['admin', 'admin-eventos']);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Próximos Eventos' })).toBeVisible();
  });

  test('administrador só da loja que abre o painel inicial é orientado pelo menu', async ({ page }) => {
    await loginComPapeis(page, ['admin', 'admin-produtos']);
    await setupApiMock(page);
    await page.goto('/admin');

    await expect(page.getByText('Use o menu ao lado para acessar os setores que você administra.')).toBeVisible();
    await expect(page.getByText('Produtos Cadastrados')).toHaveCount(0);
  });
});

/* Evento 1 do mock ("Retiro de Verão") tem álbum com as fotos g1 e g2;
   o evento 3 ("Congresso 2020") tem a g3; o evento 2 não tem álbum. */

function album(page) {
  return page.getByRole('region', { name: /Álbum do evento/ });
}

test.describe('US18 - Excluir fotos específicas do álbum', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('evento próximo abre os detalhes e o álbum direto da lista', async ({ page }) => {
    /* Antes, só os eventos anteriores tinham caminho até os detalhes. A linha
       de "Em Andamento" usa o mesmo componente. O Acampamento é de 2030, então
       fica sempre em "Próximos", seja qual for a hora do teste. */
    await page.goto('/admin/eventos');
    const linha = page
      .locator('div')
      .filter({ has: page.getByText('Acampamento Jovem', { exact: true }) })
      .filter({ has: page.getByTitle('Editar') })
      .last();

    await linha.getByRole('link', { name: 'Abrir evento e álbum' }).click();

    await expect(page).toHaveURL(/\/admin\/eventos\/2$/);
    await expect(album(page)).toContainText('Este evento não tem álbum de fotos cadastrado.');
  });

  test('o álbum aparece nos detalhes do evento, com a capa marcada', async ({ page }) => {
    await page.goto('/admin/eventos/1');

    await expect(album(page)).toContainText('(2 fotos)');
    const fotos = album(page).getByTestId('foto-do-album');
    await expect(fotos).toHaveCount(2);
    await expect(fotos.first().getByText('Capa')).toBeVisible();
    await expect(album(page).getByAltText('Foto 1 (capa)')).toBeVisible();
  });

  test('a exclusão só fica disponível depois de selecionar uma foto', async ({ page }) => {
    await page.goto('/admin/eventos/1');
    const excluir = album(page).getByRole('button', { name: /Excluir selecionadas/ });

    await expect(excluir).toBeDisabled();
    await album(page).getByLabel('Selecionar foto 2').check();
    await expect(excluir).toBeEnabled();
    await expect(excluir).toHaveText('Excluir selecionadas (1)');
  });

  test('selecionar todas e limpar a seleção', async ({ page }) => {
    await page.goto('/admin/eventos/1');

    await album(page).getByRole('button', { name: 'Selecionar todas' }).click();
    await expect(album(page).getByRole('checkbox', { checked: true })).toHaveCount(2);

    await album(page).getByRole('button', { name: 'Limpar seleção' }).click();
    await expect(album(page).getByRole('checkbox', { checked: true })).toHaveCount(0);
  });

  test('excluir a capa: a foto seguinte vira a capa e o Drive não é tocado', async ({ page }) => {
    await page.goto('/admin/eventos/1');
    await album(page).getByLabel('Selecionar foto 1 (capa)').check();
    await album(page).getByRole('button', { name: /Excluir selecionadas/ }).click();

    /* Confirmação antes de excluir (CA2) e aviso de que o Drive fica (CA6). */
    await expect(page.getByRole('heading', { name: 'Excluir 1 foto do álbum?' })).toBeVisible();
    await expect(page.getByText('O arquivo no Drive não é apagado.')).toBeVisible();

    const pedido = page.waitForRequest(
      (req) => req.method() === 'POST' && /\/evento\/1\/galeria\/excluidas$/.test(new URL(req.url()).pathname)
    );
    await page.getByRole('button', { name: 'Sim' }).click();
    expect((await pedido).postDataJSON()).toEqual({ fotos: ['g1'] });

    await expect(album(page).getByRole('status')).toHaveText(
      '1 foto excluída do site. O arquivo no Drive não foi alterado.'
    );
    /* CA3: a foto que era a segunda assume a capa. */
    await expect(album(page).getByTestId('foto-do-album')).toHaveCount(1);
    await expect(album(page).getByText('Capa')).toBeVisible();
    await expect(album(page)).toContainText('(1 foto)');
  });

  test('a foto excluída some da galeria pública e da página do evento', async ({ page }) => {
    await page.goto('/admin/eventos/1');
    await album(page).getByLabel('Selecionar foto 1 (capa)').check();
    await album(page).getByRole('button', { name: /Excluir selecionadas/ }).click();
    await page.getByRole('button', { name: 'Sim' }).click();
    await expect(album(page).getByRole('status')).toBeVisible();

    /* CA2: a galeria pública passa a ter 1 foto no álbum do evento. */
    await page.goto('/galeria');
    const retiro = page.locator('section > div.grid').getByRole('button', { name: /Retiro de Verão/ });
    await expect(retiro.getByText('1 foto', { exact: true })).toBeVisible();
    /* CA4: o álbum de outro evento não muda. */
    const congresso = page.locator('section > div.grid').getByRole('button', { name: /Congresso 2020/ });
    await expect(congresso.getByText('1 foto', { exact: true })).toBeVisible();

    await page.goto('/eventos/1-retiro-de-verao');
    await expect(page.getByAltText(/^Foto \d+ do evento$/)).toHaveCount(1);
  });

  test('desistir na confirmação não exclui nada', async ({ page }) => {
    await page.goto('/admin/eventos/1');
    await album(page).getByLabel('Selecionar foto 2').check();
    await album(page).getByRole('button', { name: /Excluir selecionadas/ }).click();

    let enviou = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && /galeria\/excluidas/.test(req.url())) enviou = true;
    });
    await page.getByRole('button', { name: 'Não' }).click();

    await expect(page.getByRole('heading', { name: /Excluir 1 foto/ })).toHaveCount(0);
    await expect(album(page).getByTestId('foto-do-album')).toHaveCount(2);
    expect(enviou).toBe(false);
  });

  test('a confirmação usa o plural quando há várias fotos', async ({ page }) => {
    await page.goto('/admin/eventos/1');
    await album(page).getByRole('button', { name: 'Selecionar todas' }).click();
    await album(page).getByRole('button', { name: /Excluir selecionadas/ }).click();

    await expect(page.getByRole('heading', { name: 'Excluir 2 fotos do álbum?' })).toBeVisible();
    await expect(page.getByText(/Elas deixam de aparecer/)).toBeVisible();
  });

  test('servidor sem a rota avisa e mantém as fotos', async ({ page }) => {
    await page.route(/\/evento\/\d+\/galeria\/excluidas$/, (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: '{"detail":"Not Found"}' })
    );
    await page.goto('/admin/eventos/1');
    await album(page).getByLabel('Selecionar foto 2').check();
    await album(page).getByRole('button', { name: /Excluir selecionadas/ }).click();
    await page.getByRole('button', { name: 'Sim' }).click();

    await expect(album(page).getByRole('alert')).toHaveText('O servidor ainda não oferece a exclusão de fotos.');
    await expect(album(page).getByTestId('foto-do-album')).toHaveCount(2);
  });

  test('durante a exclusão os botões ficam travados', async ({ page }) => {
    let liberar;
    const espera = new Promise((resolve) => { liberar = resolve; });
    await page.route(/\/evento\/\d+\/galeria\/excluidas$/, async (route) => {
      await espera;
      return route.fallback();
    });
    await page.goto('/admin/eventos/1');
    await album(page).getByLabel('Selecionar foto 2').check();
    await album(page).getByRole('button', { name: /Excluir selecionadas/ }).click();
    await page.getByRole('button', { name: 'Sim' }).click();

    await expect(page.getByRole('button', { name: 'Excluindo...' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Não' })).toBeDisabled();
    liberar();
    await expect(album(page).getByRole('status')).toBeVisible();
  });

  test('falha ao carregar o álbum é dita, e não confundida com álbum vazio', async ({ page }) => {
    await page.route(/\/evento\/1\/galeria$/, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"erro"}' })
    );
    await page.goto('/admin/eventos/1');

    await expect(album(page).getByRole('alert')).toHaveText('Não foi possível carregar o álbum.');
  });

  test('evento sem álbum avisa e não oferece exclusão', async ({ page }) => {
    await page.goto('/admin/eventos/2');

    await expect(album(page)).toContainText('Este evento não tem álbum de fotos cadastrado.');
    await expect(album(page).getByRole('button', { name: /Excluir selecionadas/ })).toHaveCount(0);
  });
});

test.describe('US18 - Administrador de setor', () => {
  test('vê o álbum, mas não a opção de excluir (CA5)', async ({ page }) => {
    await loginComPapeis(page, ['admin', 'admin-eventos']);
    await setupApiMock(page);
    await page.goto('/admin/eventos/1');

    await expect(album(page).getByTestId('foto-do-album')).toHaveCount(2);
    await expect(album(page).getByRole('checkbox')).toHaveCount(0);
    await expect(album(page).getByRole('button', { name: /Excluir selecionadas/ })).toHaveCount(0);
    await expect(album(page).getByText('Só a superadministradora pode excluir fotos do álbum.')).toBeVisible();
  });
});
