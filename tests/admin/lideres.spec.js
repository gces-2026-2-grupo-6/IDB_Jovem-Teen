import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin, loginAsPlainAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Admin - Diretores & Líderes CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/lideres', { waitUntil: 'domcontentloaded' });
  });

  test('deve exibir a listagem com badge de superadmin, abas e cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Diretores & Líderes', exact: true })).toBeVisible();
    await expect(page.getByText('Acesso exclusivo do Superadministrador')).toBeVisible();
    await expect(page.getByRole('link', { name: /Cadastrar Diretor\/Líder/i })).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Líderes atuais' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Diretores anteriores' })).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByText('A galeria de diretores anteriores contempla apenas o cargo nacional.')).toBeVisible();

    // Seed do mock: 3 atuais (2 nacionais + 1 regional)
    const cards = page.getByTestId('leader-card');
    await expect(cards).toHaveCount(3);
    // Badges são <span>; a linha de região é um <p> com o mesmo texto
    await expect(cards.filter({ hasText: 'João Diretor' }).locator('span', { hasText: /^Nacional$/ })).toBeVisible();
    await expect(cards.filter({ hasText: 'Pedro Líder' }).locator('span', { hasText: /^Regional$/ })).toBeVisible();
    await expect(cards.filter({ hasText: 'Pedro Líder' }).locator('span', { hasText: /^Atual$/ })).toBeVisible();
  });

  test('deve alternar para a aba de diretores anteriores (apenas cargo nacional)', async ({ page }) => {
    await page.getByRole('tab', { name: 'Diretores anteriores' }).click();
    await expect(page.getByRole('tab', { name: 'Diretores anteriores' })).toHaveAttribute('aria-selected', 'true');

    const cards = page.getByTestId('leader-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.filter({ hasText: 'Antiga Diretora' })).toBeVisible();
    await expect(cards.filter({ hasText: 'Antiga Diretora' }).getByText('Gestão 2020 – 2023')).toBeVisible();
    await expect(cards.filter({ hasText: 'Antiga Diretora' }).locator('span', { hasText: /^Anterior$/ })).toBeVisible();
    // Líder atual não aparece na galeria
    await expect(page.getByText('João Diretor')).toHaveCount(0);
  });

  test('deve cadastrar um novo líder com todos os campos', async ({ page }) => {
    await page.getByRole('link', { name: /Cadastrar Diretor\/Líder/i }).click();

    await expect(page).toHaveURL(/\/admin\/lideres\/criar/);
    await expect(page.getByRole('heading', { name: 'Cadastro de Diretor/Líder' })).toBeVisible();
    await expect(page.getByText('Adicionar Foto').first()).toBeVisible();

    await page.getByPlaceholder('Nome do diretor/líder').fill('Líder Playwright');
    await page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes').fill('Diretor Regional de Jovens');
    await page.locator('select[name="region"]').selectOption('Região Nordeste');
    await page.getByPlaceholder(/@instagram/).fill('@lider.playwright');
    await page.getByPlaceholder('Cole o link da foto (Google Drive)').fill('https://drive.google.com/file/d/abc123/view');
    await page.getByPlaceholder('Breve apresentação do diretor/líder').fill('Bio de teste E2E.');

    // Preview aparece a partir do link do Drive
    await expect(page.getByAltText('Preview da foto')).toBeVisible();

    const postPromise = page.waitForRequest((r) => r.url().includes('/lider') && r.method() === 'POST');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    const post = await postPromise;
    const body = post.postDataJSON();
    expect(body).toMatchObject({
      nome: 'Líder Playwright',
      cargo: 'Diretor Regional de Jovens',
      regiao: 'Região Nordeste',
      redes_sociais: '@lider.playwright',
      bio: 'Bio de teste E2E.',
      is_antigo: false,
    });
    expect(body.imagem_url).toContain('abc123');

    await expect(page).toHaveURL(/\/admin\/lideres$/);
    await expect(page.getByRole('status')).toHaveText(/cadastrado com sucesso/i);
    await expect(page.getByTestId('leader-card').filter({ hasText: 'Líder Playwright' })).toBeVisible();
  });

  test('deve marcar manualmente um líder como diretor anterior e avisar quando não for nacional', async ({ page }) => {
    await page.goto('/admin/lideres/criar', { waitUntil: 'domcontentloaded' });

    const toggle = page.getByRole('switch', { name: 'Marcar como diretor anterior' });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByPlaceholder('Ex.: 2020 – 2023')).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByPlaceholder('Ex.: 2020 – 2023')).toBeVisible();

    // Regional + anterior → aviso de que não entra na galeria
    await page.locator('select[name="region"]').selectOption('Região Sul');
    await expect(page.getByText(/não aparecerá na galeria de diretores anteriores/i)).toBeVisible();

    await page.locator('select[name="region"]').selectOption('Nacional');
    await expect(page.getByText(/não aparecerá na galeria de diretores anteriores/i)).toHaveCount(0);

    await page.getByPlaceholder('Nome do diretor/líder').fill('Ex-Diretor E2E');
    await page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes').fill('Diretor Nacional de Jovens');
    await page.getByPlaceholder('Ex.: 2020 – 2023').fill('2010 – 2013');

    const postPromise = page.waitForRequest((r) => r.url().includes('/lider') && r.method() === 'POST');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    const body = (await postPromise).postDataJSON();
    expect(body).toMatchObject({ is_antigo: true, gestao: '2010 – 2013', regiao: 'Nacional' });

    await expect(page).toHaveURL(/\/admin\/lideres$/);
    await page.getByRole('tab', { name: 'Diretores anteriores' }).click();
    const card = page.getByTestId('leader-card').filter({ hasText: 'Ex-Diretor E2E' });
    await expect(card).toBeVisible();
    await expect(card.getByText('Gestão 2010 – 2013')).toBeVisible();
  });

  test('deve exigir nome e cargo no cadastro', async ({ page }) => {
    await page.goto('/admin/lideres/criar', { waitUntil: 'domcontentloaded' });

    await expect(page.getByPlaceholder('Nome do diretor/líder')).toHaveAttribute('required', '');
    await expect(page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes')).toHaveAttribute('required', '');
  });

  test('deve testar os botões de Voltar e Cancelar na criação e edição', async ({ page }) => {
    await page.goto('/admin/lideres/criar', { waitUntil: 'domcontentloaded' });
    await page.getByTitle('Voltar').click();
    await expect(page).toHaveURL(/\/admin\/lideres$/);

    await page.goto('/admin/lideres/criar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page).toHaveURL(/\/admin\/lideres$/);

    await page.goto('/admin/lideres/301/editar', { waitUntil: 'domcontentloaded' });
    await page.getByTitle('Voltar').click();
    await expect(page).toHaveURL(/\/admin\/lideres$/);

    await page.goto('/admin/lideres/301/editar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page).toHaveURL(/\/admin\/lideres$/);
  });

  test('deve editar um líder existente com o formulário pré-preenchido', async ({ page }) => {
    await page.getByTestId('leader-card').filter({ hasText: 'João Diretor' }).getByRole('button', { name: 'Editar' }).click();

    await expect(page).toHaveURL(/\/admin\/lideres\/301\/editar/);
    await expect(page.getByRole('heading', { name: 'Edição de Diretor/Líder' })).toBeVisible();
    await expect(page.getByText('Editar Foto').first()).toBeVisible();

    const nome = page.getByPlaceholder('Nome do diretor/líder');
    await expect(nome).toHaveValue('João Diretor');
    await expect(page.locator('select[name="region"]')).toHaveValue('Nacional');
    await expect(page.getByPlaceholder(/@instagram/)).toHaveValue('@joao');
    await expect(page.getByPlaceholder('Breve apresentação do diretor/líder')).toHaveValue('Bio do João.');

    await nome.fill('João Diretor Editado');

    const putPromise = page.waitForRequest((r) => r.url().includes('/lider/301') && r.method() === 'PUT');
    await page.getByRole('button', { name: 'Salvar' }).click();
    expect((await putPromise).postDataJSON()).toMatchObject({ nome: 'João Diretor Editado' });

    await expect(page).toHaveURL(/\/admin\/lideres$/);
    await expect(page.getByRole('status')).toHaveText(/atualizado com sucesso/i);
    await expect(page.getByTestId('leader-card').filter({ hasText: 'João Diretor Editado' })).toBeVisible();
  });

  test('deve exibir mensagem de não encontrado para edição inválida', async ({ page }) => {
    await page.goto('/admin/lideres/999999/editar', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Diretor/líder não encontrado.')).toBeVisible();
    await page.getByRole('button', { name: /Voltar para Diretores/ }).click();
    await expect(page).toHaveURL(/\/admin\/lideres$/);
  });

  test('deve abrir o modal de exclusão e fechar sem excluir', async ({ page }) => {
    await page.getByTestId('leader-card').filter({ hasText: 'Pedro Líder' }).getByRole('button', { name: 'Excluir' }).click();

    await expect(page.getByRole('heading', { name: 'Excluir diretor/líder?' })).toBeVisible();
    await expect(page.getByText(/O registro de/)).toContainText('Pedro Líder');
    await expect(page.getByText('Apenas o superadministrador pode excluir registros.')).toBeVisible();

    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('heading', { name: 'Excluir diretor/líder?' })).toHaveCount(0);
    await expect(page.getByTestId('leader-card')).toHaveCount(3);
  });

  test('deve confirmar a exclusão e exibir a mensagem de sucesso', async ({ page }) => {
    await page.getByTestId('leader-card').filter({ hasText: 'Pedro Líder' }).getByRole('button', { name: 'Excluir' }).click();

    const deletePromise = page.waitForRequest((r) => r.url().includes('/lider/303') && r.method() === 'DELETE');
    await page.getByRole('button', { name: 'Excluir', exact: true }).last().click();
    await deletePromise;

    await expect(page.getByRole('status')).toHaveText('Diretor/líder excluído com sucesso.');
    await expect(page.getByTestId('leader-card')).toHaveCount(2);
    await expect(page.getByText('Pedro Líder')).toHaveCount(0);
  });

  test('deve exibir estado vazio quando a API falhar', async ({ page }) => {
    await page.route(/\/lider\/?(\?.*)?$/, (route) => route.abort('failed'));
    await page.goto('/admin/lideres', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Não foi possível carregar os diretores e líderes.')).toBeVisible();
  });
});

test.describe('Admin - Diretores & Líderes (restrição ao superadmin)', () => {
  test('admin comum não vê o link na sidebar e é redirecionado ao acessar a rota', async ({ page }) => {
    await loginAsPlainAdmin(page);
    await setupApiMock(page);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('aside').getByRole('link', { name: /Diretores & Líderes/i })).toHaveCount(0);

    await page.goto('/admin/lideres', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin\/produtos/);

    await page.goto('/admin/lideres/criar', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin\/produtos/);
  });
});
