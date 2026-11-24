import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';
import { loginAsAdmin, loginComPapeis } from '../helpers/adminAuth';

/* US10 — Cadastro nacional de líderes.
 *
 * O cadastro dos mais de 2500 líderes acontece fora do site: cada líder se
 * inscreve pelo formulário externo exposto em destaque no cabeçalho do site
 * e as respostas caem numa planilha fixada na home do painel.
 *
 * No mock: o link de cadastro já está configurado; o da planilha, ainda não.
 */

const CARD = 'Cadastro nacional de líderes';

test.describe('US10 - Link de cadastro na área pública e planilha no painel', () => {
  test('área pública exibe o botão de cadastro de líderes no cabeçalho sem exigir login', async ({ page, isMobile }) => {
    await setupApiMock(page);

    await page.goto('/');

    /* O botão não fica mais dentro de Nosso Organograma. */
    await expect(page.locator('main').getByTestId('link-cadastro-lideres-publico')).toHaveCount(0);

    if (!isMobile) {
      const botao = page.locator('header').getByTestId('link-cadastro-lideres-publico');
      await expect(botao).toBeVisible();
      await expect(botao).toHaveText(/Cadastro de líderes nacionais/);
      await expect(botao).toHaveAttribute('href', 'https://forms.gle/cadastro-lideres');
      await expect(botao).toHaveAttribute('target', '_blank');
    }
  });

  test('home do painel exibe apenas a planilha de respostas (sem o bloco de cadastro)', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: CARD })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Planilha de respostas' })).toBeVisible();
    await expect(page.getByTestId('link-cadastro')).toHaveCount(0);

    /* Planilha ainda não configurada: o card oferece "Configurar" em vez de
       sumir, senão não haveria por onde cadastrá-la pela primeira vez. */
    const planilha = page.getByTestId('link-planilha');
    await expect(planilha.getByRole('button', { name: 'Configurar' })).toBeVisible();
  });

  test('superadministradora gerencia o link público de cadastro em Diretores & Líderes', async ({ page, browserName }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin/lideres');

    const card = page.getByTestId('link-cadastro');
    await expect(card).toBeVisible();
    await expect(card.getByText('https://forms.gle/cadastro-lideres')).toBeVisible();

    const abrir = card.getByRole('link', { name: 'Abrir' });
    await expect(abrir).toHaveAttribute('href', 'https://forms.gle/cadastro-lideres');
    await expect(abrir).toHaveAttribute('target', '_blank');

    const leClipboard = browserName !== 'webkit';
    if (leClipboard) {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    }

    await card.getByRole('button', { name: 'Copiar' }).click();
    await expect(card.getByRole('button', { name: 'Copiado' })).toBeVisible();

    if (leClipboard) {
      const copiado = await page.evaluate(() => navigator.clipboard.readText());
      expect(copiado).toBe('https://forms.gle/cadastro-lideres');
    }
  });

  test('CA3: o administrador de setor não vê os links do painel, e o site nem os pede', async ({ page }) => {
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

  test('CA4: configurar a planilha na home não apaga o link público de cadastro', async ({ page, isMobile }) => {
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

    /* O link público de cadastro continua intacto no cabeçalho da área pública. */
    await page.goto('/');
    if (!isMobile) {
      await expect(page.locator('header').getByTestId('link-cadastro-lideres-publico')).toHaveAttribute(
        'href',
        'https://forms.gle/cadastro-lideres'
      );
    }
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

  test('remover o link de cadastro faz o botão sumir da área pública', async ({ page }) => {
    await setupApiMock(page);
    await loginAsAdmin(page);

    await page.goto('/admin/lideres');

    const cadastro = page.getByTestId('link-cadastro');

    await cadastro.getByRole('button', { name: 'Trocar' }).click();
    await cadastro.getByLabel('Link de cadastro de líderes').fill('');
    await cadastro.getByRole('button', { name: 'Salvar' }).click();

    await expect(cadastro.getByRole('button', { name: 'Configurar' })).toBeVisible();

    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByTestId('link-cadastro-lideres-publico')).toHaveCount(0);
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
