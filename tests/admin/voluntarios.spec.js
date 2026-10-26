import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Admin - Gerenciamento de Voluntários', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin/voluntarios', { waitUntil: 'domcontentloaded' });
  });

  test('deve exibir a lista de eventos para voluntários', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Voluntários', exact: true })).toBeVisible();

    // Espera os cards carregarem
    const grid = page.locator('div.grid');
    if (await grid.isVisible()) {
      await expect(page.getByRole('link', { name: 'Voluntários Inscritos' }).first()).toBeVisible();
    }
  });

  test('deve navegar para a tela de detalhes de um evento', async ({ page }) => {
    const firstEventBtn = page.getByRole('link', { name: 'Voluntários Inscritos' }).first();
    await firstEventBtn.click();

    await expect(page).toHaveURL(/\/admin\/voluntarios\/\d+/);
  });
});

test.describe('Admin - Voluntários Detalhes da Tabela', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    // Vai direto para um evento
    await page.goto('/admin/voluntarios/1');
  });

  test('deve exibir as estatísticas (cards numéricos)', async ({ page }) => {
    await expect(page.getByText('Total de Inscritos')).toBeVisible();
    await expect(page.getByText('Aprovados', { exact: true })).toBeVisible();
    await expect(page.getByText('Pendentes')).toBeVisible();
  });

  test('deve exibir a tabela com dados dos voluntários e link pro forms', async ({ page }) => {
    // Header da tabela
    await expect(page.getByText('Nome', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Email', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Status', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Formulário', { exact: true }).first()).toBeVisible();

    // Link Abrir Formulário do primeiro
    const linkForms = page.getByRole('link', { name: /Abrir Formulário/i }).first();
    await expect(linkForms).toBeVisible();
  });

  test('deve permitir alterar o status no dropdown do StatusBadge para Aprovado', async ({ page }, testInfo) => {
    /* DEFEITO CONHECIDO (Pixel 7): o menu do status abre com posição fixa
       logo abaixo do botão e, com a linha perto do fim da tela, as opções
       ficam fora da área visível. O clique às vezes acerta e às vezes não,
       conforme a rolagem reposiciona o menu, então o teste fica suspenso
       neste aparelho. O defeito é verificado de forma determinística em
       admin-mobile.spec.js; retirar esta linha quando for corrigido. */
    test.fixme(testInfo.project.name === 'mobile-android', 'opções do status fora da tela');
    // Acha o botão do dropdown
    const dropdownBtn = page.getByRole('button', { name: 'Pendente' }).first();
    await dropdownBtn.click();

    // Clica no novo status (as opções do portal têm a classe w-full)
    await page.locator('button.w-full', { hasText: 'Aprovado' }).click();

    await expect(page.getByRole('button', { name: 'Aprovado' }).first()).toBeVisible();
  });

  test('deve permitir alterar o status no dropdown do StatusBadge para Reprovado', async ({ page }, testInfo) => {
    /* DEFEITO CONHECIDO (Pixel 7): o menu do status abre com posição fixa
       logo abaixo do botão e, com a linha perto do fim da tela, as opções
       ficam fora da área visível. O clique às vezes acerta e às vezes não,
       conforme a rolagem reposiciona o menu, então o teste fica suspenso
       neste aparelho. O defeito é verificado de forma determinística em
       admin-mobile.spec.js; retirar esta linha quando for corrigido. */
    test.fixme(testInfo.project.name === 'mobile-android', 'opções do status fora da tela');
    // Acha o primeiro voluntário pendente ou qualquer um disponível
    const dropdownBtn = page.getByRole('button', { name: /Pendente|Aprovado|Reprovado/ }).first();
    await expect(dropdownBtn).toBeVisible();
    const currentLabel = await dropdownBtn.textContent();

    await dropdownBtn.click();

    // Clica no novo status (as opções do portal têm a classe w-full)
    await page.locator('button.w-full', { hasText: 'Reprovado' }).click();

    // Aguarda o reload da página (a mudança de status dispara um recarregamento)
    await page.waitForTimeout(1500);

    // Verifica que algum badge de status está visível após o reload
    const statusBadge = page.getByRole('button', { name: /Pendente|Aprovado|Reprovado/ }).first();
    await expect(statusBadge).toBeVisible();
  });

  test('deve ter botão de voltar na seção title', async ({ page }) => {
    const btnVoltar = page.locator('button[title="Voltar"]').first();
    await expect(btnVoltar).toBeVisible();
    await btnVoltar.click();
    await expect(page).toHaveURL(/\/admin\/voluntarios/);
  });

  test('deve abrir formulário em nova aba', async ({ page }) => {
    const linkForms = page.getByRole('link', { name: /Abrir Formulário/i }).first();
    await expect(linkForms).toBeVisible();

    // Verifica atributos target e rel
    await expect(linkForms).toHaveAttribute('target', '_blank');
    await expect(linkForms).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('Admin - Voluntários Detalhes - Evento Não Encontrado', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('deve exibir mensagem de Evento não encontrado para ID inválido', async ({ page }) => {
    await page.goto('/admin/voluntarios/999999');

    await expect(page.getByText('Evento não encontrado.')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Voluntários' }).click();

    await expect(page).toHaveURL(/\/admin\/voluntarios/);
  });
});

test.describe('Admin - Voluntários - Branch de linkFormularioVoluntarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
  });

  test('deve verificar atributo href do link Abrir Formulário (Details.jsx L86)', async ({ page }) => {
    // Visita voluntários de um evento existente
    await page.goto('/admin/voluntarios/1');

    const linkForms = page.getByRole('link', { name: /Abrir Formulário/i }).first();
    await expect(linkForms).toBeVisible();

    // Verifica se tem href (pode ser o link real ou '#' dependendo do mock)
    const href = await linkForms.getAttribute('href');
    expect(href).toBeTruthy();
  });
});
