import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';
import { loginAsAdmin, loginComPapeis } from '../helpers/adminAuth';

/* US11 — Materiais para download, painel.
 *
 * "Só o superadmin envia." Cadastrar, editar e excluir são exclusivos da
 * superadministradora; o servidor recusa os demais papéis, e o painel não
 * oferece o que seria recusado.
 */

test.describe('US11 - Painel de materiais (superadministradora)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);
  });

  test('lista os materiais cadastrados com o tipo de cada um', async ({ page }) => {
    await page.goto('/admin/materiais');

    await expect(page.getByRole('heading', { name: 'Materiais' })).toBeVisible();
    await expect(page.getByText('Manual do Líder 2026')).toBeVisible();
    await expect(page.getByText('Vídeo institucional')).toBeVisible();
  });

  test('CA1: material cadastrado passa a aparecer na área pública, com o tipo', async ({ page }) => {
    await page.goto('/admin/materiais/criar');

    await page.getByLabel('Título').fill('Devocional de Novembro');
    await page.getByRole('button', { name: 'Documento' }).click();
    await page
      .getByLabel('Link do arquivo')
      .fill('https://drive.google.com/file/d/devocional/view');
    await page.getByLabel('Descrição (opcional)').fill('Para imprimir e distribuir');

    const post = page.waitForRequest(
      (r) => r.url().includes('/material/') && r.method() === 'POST'
    );
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    expect((await post).postDataJSON()).toMatchObject({
      titulo: 'Devocional de Novembro',
      tipo: 'documento',
      link: 'https://drive.google.com/file/d/devocional/view',
      descricao: 'Para imprimir e distribuir',
    });

    await expect(page).toHaveURL(/\/admin\/materiais$/);

    /* O mesmo material, agora visto por quem não entrou no site. */
    await page.goto('/materiais');
    await expect(page.getByRole('heading', { name: 'Devocional de Novembro' })).toBeVisible();
  });

  test('edita um material já cadastrado', async ({ page }) => {
    await page.goto('/admin/materiais/1/editar');

    const titulo = page.getByLabel('Título');
    await expect(titulo).toHaveValue('Manual do Líder 2026');

    await titulo.fill('Manual do Líder 2027');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page).toHaveURL(/\/admin\/materiais$/);
    await expect(page.getByText('Manual do Líder 2027')).toBeVisible();
  });

  test('CA4: material excluído deixa de aparecer na área pública', async ({ page }) => {
    await page.goto('/admin/materiais');

    const linha = page.getByTestId('material-row').filter({ hasText: 'Manual do Líder 2026' });
    await linha.getByTitle('Excluir').click();
    await page.getByRole('button', { name: 'Sim' }).click();

    await expect(page.getByText('Manual do Líder 2026')).toHaveCount(0);

    await page.goto('/materiais');
    await expect(page.getByRole('heading', { name: 'Manual do Líder 2026' })).toHaveCount(0);
  });

  test('título em branco é recusado antes de chegar ao servidor', async ({ page }) => {
    await page.goto('/admin/materiais/criar');

    /* O campo é obrigatório no HTML; a validação do serviço é a segunda
       barreira, para o caso de o formulário ser contornado. */
    await expect(page.getByLabel('Título')).toHaveAttribute('required', '');
  });

  test('link sem https:// é recusado com explicação', async ({ page }) => {
    await page.goto('/admin/materiais/criar');

    await page.getByLabel('Título').fill('Material com link inválido');
    /* `type="url"` barraria o envio, então o teste chama o serviço direto
       para exercitar a validação que protege quem contorna o formulário. */
    const erro = await page.evaluate(async () => {
      const mod = await import('/src/services/materialService.js');
      const r = await mod.handleCreateMaterial({
        title: 'X',
        type: 'documento',
        link: 'drive.google.com/file',
      });
      return r.error;
    });

    expect(erro).toBe('O link deve começar com https:// ou http://.');
  });
});

test.describe('US11 - CA2: o administrador de setor não gerencia materiais', () => {
  test('não vê o item no menu nem alcança a rota', async ({ page }) => {
    await setupApiMock(page);
    await loginComPapeis(page, ['admin', 'admin-eventos']);

    await page.goto('/admin');
    await expect(page.getByRole('link', { name: 'Materiais' })).toHaveCount(0);

    await page.goto('/admin/materiais');
    await expect(page).toHaveURL(/\/unauthorized/);
  });
});
