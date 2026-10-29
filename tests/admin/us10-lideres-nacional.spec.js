import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';
import { loginAsAdmin, loginComPapeis } from '../helpers/adminAuth';

/* US10 — Cadastro nacional de líderes.
 *
 * O cadastro dos mais de 2500 líderes acontece fora do site: cada líder se
 * inscreve por um formulário externo e as respostas caem numa planilha. O
 * painel fixa os dois endereços e impede que dois líderes ativos ocupem o
 * mesmo cargo.
 *
 * No mock: o link de cadastro já está configurado; o da planilha, ainda não.
 */

const CARD = 'Cadastro nacional de líderes';

test.describe('US10 - Links fixados na página inicial do painel', () => {
  test('CA1: a superadministradora vê o link de cadastro e pode abri-lo e copiá-lo', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin');

    const card = page.getByTestId('link-cadastro');
    await expect(page.getByRole('heading', { name: CARD })).toBeVisible();
    await expect(card.getByText('https://forms.gle/cadastro-lideres')).toBeVisible();

    /* Abrir: é um link de verdade, para a pessoa usar o menu do navegador. */
    const abrir = card.getByRole('link', { name: 'Abrir' });
    await expect(abrir).toHaveAttribute('href', 'https://forms.gle/cadastro-lideres');
    await expect(abrir).toHaveAttribute('target', '_blank');

    /* Copiar: o endereço vai para a área de transferência, para divulgar. */
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await card.getByRole('button', { name: 'Copiar' }).click();
    await expect(card.getByRole('button', { name: 'Copiado' })).toBeVisible();

    const copiado = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiado).toBe('https://forms.gle/cadastro-lideres');
  });

  test('CA2: o link da planilha aparece separado do de cadastro', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Link de cadastro de líderes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Planilha de respostas' })).toBeVisible();

    /* Planilha ainda não configurada: o card oferece "Configurar" em vez de
       sumir, senão não haveria por onde cadastrá-la pela primeira vez. */
    const planilha = page.getByTestId('link-planilha');
    await expect(planilha.getByRole('button', { name: 'Configurar' })).toBeVisible();
  });

  test('CA3: o administrador de setor não vê nenhum dos dois links, e o site nem os pede', async ({ page }) => {
    await setupApiMock(page);
    await loginComPapeis(page, ['admin', 'admin-eventos']);

    /* A planilha reúne dados pessoais de mais de 2500 líderes: esconder o card
       não basta, a requisição não pode sequer acontecer. */
    const pedidos = [];
    page.on('request', (req) => {
      if (req.url().includes('/painel/links')) pedidos.push(req.url());
    });

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await expect(page.getByTestId('links-lideres')).toHaveCount(0);
    expect(pedidos).toEqual([]);
  });

  test('CA4: trocar um link não depende da equipe técnica nem apaga o outro', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin');

    const planilha = page.getByTestId('link-planilha');

    await planilha.getByRole('button', { name: 'Configurar' }).click();
    await planilha
      .getByLabel('Planilha de respostas')
      .fill('https://docs.google.com/spreadsheets/d/respostas');
    await planilha.getByRole('button', { name: 'Salvar' }).click();

    await expect(planilha.getByText('https://docs.google.com/spreadsheets/d/respostas')).toBeVisible();

    /* O link de cadastro continua lá: a atualização é parcial. */
    await expect(page.getByText('https://forms.gle/cadastro-lideres')).toBeVisible();
  });

  test('link sem https:// é recusado antes de chegar ao servidor', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin');

    const planilha = page.getByTestId('link-planilha');

    await planilha.getByRole('button', { name: 'Configurar' }).click();
    await planilha.getByLabel('Planilha de respostas').fill('docs.google.com/spreadsheets');
    await planilha.getByRole('button', { name: 'Salvar' }).click();

    await expect(
      planilha.getByText('O link deve começar com https:// ou http://.')
    ).toBeVisible();
  });

  test('campo em branco remove o link fixado', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin');

    const cadastro = page.getByTestId('link-cadastro');

    await cadastro.getByRole('button', { name: 'Trocar' }).click();
    await cadastro.getByLabel('Link de cadastro de líderes').fill('');
    await cadastro.getByRole('button', { name: 'Salvar' }).click();

    await expect(cadastro.getByRole('button', { name: 'Configurar' })).toBeVisible();
  });
});

test.describe('US10 - Cargo único por abrangência', () => {
  test('CA8: cadastrar um segundo líder ativo no mesmo cargo é recusado, com explicação', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin/lideres/criar');

    await page.getByPlaceholder('Nome do diretor/líder').fill('Novo Diretor');
    /* "João Diretor" já ocupa este cargo na região Nacional. */
    await page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes').fill('Diretor Nacional de Jovens');
    await page.locator('select[name="region"]').selectOption('Nacional');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    const aviso = page.getByRole('alert');
    await expect(aviso).toContainText('já está ocupado por João Diretor');
    await expect(aviso).toContainText('Marque o líder atual como diretor anterior');

    /* O formulário continua preenchido: a correção é trocar o cargo, não
       redigitar tudo. */
    await expect(page.getByPlaceholder('Nome do diretor/líder')).toHaveValue('Novo Diretor');
    await expect(page).toHaveURL(/\/admin\/lideres\/criar/);
  });

  test('CA9: o mesmo cargo em regiões diferentes convive', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin/lideres/criar');

    /* "Pedro Líder" ocupa este cargo na Região Sul; o Nordeste é outro cargo. */
    await page.getByPlaceholder('Nome do diretor/líder').fill('Diretor do Nordeste');
    await page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes').fill('Diretor Regional de Jovens');
    await page.locator('select[name="region"]').selectOption('Região Nordeste');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page).toHaveURL(/\/admin\/lideres$/);
    await expect(page.getByText('Diretor do Nordeste')).toBeVisible();
  });

  test('a comparação ignora acento, caixa e hífen', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin/lideres/criar');

    await page.getByPlaceholder('Nome do diretor/líder').fill('Tentativa Disfarçada');
    /* Mesma coisa que "Diretor Nacional de Jovens", escrita de outro jeito. */
    await page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes').fill('diretor-nacional de jovens');
    await page.locator('select[name="region"]').selectOption('Nacional');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page.getByRole('alert')).toContainText('já está ocupado');
  });

  test('CA7: marcar o antecessor como diretor anterior libera o cargo', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    /* Primeiro o antecessor sai de cena... */
    await page.goto('/admin/lideres/301/editar');
    await page.getByLabel('Marcar como diretor anterior').click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/admin\/lideres$/);

    /* ...e só então o sucessor assume o mesmo cargo. */
    await page.goto('/admin/lideres/criar');
    await page.getByPlaceholder('Nome do diretor/líder').fill('Sucessor Nacional');
    await page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes').fill('Diretor Nacional de Jovens');
    await page.locator('select[name="region"]').selectOption('Nacional');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page).toHaveURL(/\/admin\/lideres$/);
    await expect(page.getByText('Sucessor Nacional')).toBeVisible();
  });

  test('a regra vale também na edição', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    /* "Pedro Líder" (regional) tenta assumir o cargo nacional já ocupado. */
    await page.goto('/admin/lideres/303/editar');
    await page.getByPlaceholder('Ex.: Diretora Nacional de Adolescentes').fill('Diretor Nacional de Jovens');
    await page.locator('select[name="region"]').selectOption('Nacional');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByRole('alert')).toContainText('já está ocupado por João Diretor');
  });
});
