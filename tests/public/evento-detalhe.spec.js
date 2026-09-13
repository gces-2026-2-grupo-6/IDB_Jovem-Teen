import { test, expect } from '../helpers/testWithCoverage.js';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Página de Detalhes do Evento', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page);
  });

  test('deve carregar informações de um evento válido', async ({ page }) => {
    await page.goto('/eventos/1-retiro-de-verao');

    // Hero Section
    const titulo = page.getByRole('heading', { name: 'Retiro de Verão' });
    await expect(titulo).toBeVisible();

    const desc = page.getByText(/Um retiro incrível para os jovens/i);
    await expect(desc).toBeVisible();

    const loc = page.getByText('Sítio Boa Vista');
    await expect(loc).toBeVisible();

    // Botão voltar do Hero
    const btnVoltar = page.getByLabel('Voltar');
    await expect(btnVoltar).toBeVisible();

    // Seção de Speakers
    await expect(page.getByRole('heading', { name: 'Palestrantes' })).toBeVisible();

    // Seção de Programação
    await expect(page.getByRole('heading', { name: 'Programação do evento' })).toBeVisible();

    // Seção de Galeria de Fotos
    await expect(page.getByRole('heading', { name: 'Galeria do evento' })).toBeVisible();
  });

  test('deve exibir mensagem de "Evento não encontrado" para slug inválido', async ({ page }) => {
    await page.goto('/eventos/slug-que-nao-existe');

    const tituloErro = page.getByRole('heading', { name: 'Evento não encontrado' });
    await expect(tituloErro).toBeVisible();

    const textoErro = page.getByText('O evento que você procura não existe ou foi removido.');
    await expect(textoErro).toBeVisible();

    const btnVerTodos = page.getByRole('link', { name: 'Ver todos os eventos' });
    await expect(btnVerTodos).toBeVisible();

    // Testa se o link redireciona
    await btnVerTodos.click();
    await expect(page).toHaveURL(/\/eventos$/);
  });

  test('deve navegar para trás ao clicar no botão Voltar do Hero', async ({ page }) => {
    // Navega primeiro para eventos, depois para detalhes para ter histórico
    await page.goto('/eventos');
    await page.goto('/eventos/1-retiro-de-verao');

    const btnVoltar = page.getByLabel('Voltar');
    await expect(btnVoltar).toBeVisible();

    await btnVoltar.click();
    await expect(page).toHaveURL(/\/eventos$/);
  });

  test('deve renderizar os cards de speakers com nome e profissão', async ({ page }) => {
    await page.goto('/eventos/1-retiro-de-verao');

    // Seção de speakers deve existir
    const speakerSection = page.locator('section').filter({ hasText: 'Palestrantes' });
    await expect(speakerSection).toBeVisible();

    // Deve renderizar 4 speakers
    const speakerNames = speakerSection.locator('h3');
    const count = await speakerNames.count();
    expect(count).toBe(4);

    // Cada speaker deve ter profissão
    const speakerRoles = speakerSection.locator('p');
    const rolesCount = await speakerRoles.count();
    expect(rolesCount).toBe(4);

    const speakerImages = speakerSection.locator('img');
    const imgCount = await speakerImages.count();
    expect(imgCount).toBe(4);

    for (let i = 0; i < imgCount; i++) {
      await expect(speakerImages.nth(i)).toHaveAttribute('alt', /./);
    }
  });

  test('deve renderizar a programação com horários e atividades', async ({ page }) => {
    await page.goto('/eventos/1-retiro-de-verao');

    const scheduleSection = page.locator('section').filter({ hasText: 'Programação do evento' });
    await expect(scheduleSection).toBeVisible();

    /* evento 1 tem 4 atividades. Busca pelo título da atividade, e não por
       texto solto: "Louvor" também aparece na descrição ("Momento de louvor"),
       e a busca por texto casava com os dois. */
    for (const atividade of ['Abertura', 'Louvor', 'Ministração', 'Encerramento']) {
      await expect(
        scheduleSection.getByRole('heading', { name: atividade, exact: true })
      ).toBeVisible();
    }

    // Verifica os horários
    await expect(scheduleSection.getByText('17:00 - 18:00')).toBeVisible();
    await expect(scheduleSection.getByText('18:00 - 19:00')).toBeVisible();
    await expect(scheduleSection.getByText('19:00 - 20:30')).toBeVisible();
    await expect(scheduleSection.getByText('20:30 - 21:00')).toBeVisible();
  });

  test('deve renderizar a galeria do evento quando existem fotos', async ({ page }) => {
    await page.goto('/eventos/1-retiro-de-verao');

    // evento 1 tem galeria com fotos
    const galeriaSection = page.locator('section').filter({ hasText: 'Galeria do evento' });
    await expect(galeriaSection).toBeVisible();

    const imgs = galeriaSection.locator('img');
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);

    await expect(imgs.first()).toHaveAttribute('alt', /Foto \d+ do evento/);
  });

  test('não deve renderizar galeria quando não existem fotos', async ({ page }) => {
    await page.goto('/eventos/2-acampamento-jovem');

    // Speakers devem estar visíveis
    await expect(page.getByRole('heading', { name: 'Palestrantes' })).toBeVisible();

    // Galeria do evento NÃO deve aparecer (evento 2 não tem fotos)
    const galeriaHeading = page.getByRole('heading', { name: 'Galeria do evento' });
    await expect(galeriaHeading).not.toBeVisible();
  });

  test('deve carregar o evento acessando apenas pelo id no slug', async ({ page }) => {
    // O slug é resolvido pelo id numérico no início
    await page.goto('/eventos/1');

    await expect(page.getByRole('heading', { name: 'Retiro de Verão' })).toBeVisible();

    // 4 speakers
    const speakerSection = page.locator('section').filter({ hasText: 'Palestrantes' });
    expect(await speakerSection.locator('h3').count()).toBe(4);

    // Programação visível
    const scheduleSection = page.locator('section').filter({ hasText: 'Programação do evento' });
    await expect(scheduleSection.getByText('Abertura')).toBeVisible();
  });

  test('deve cobrir o botão Seja Voluntário no Hero com linkFormularioVoluntarios', async ({ page }) => {
    await page.goto('/eventos/1-retiro-de-verao');
    
    // Intercepta window.open
    await page.evaluate(() => {
      window.open = () => null;
    });

    const btnVoluntario = page.getByRole('button', { name: 'Seja Voluntário' });
    await expect(btnVoluntario).toBeVisible();
    await btnVoluntario.click();
  });

  test('deve cobrir o botão Seja Voluntário no Hero sem linkFormularioVoluntarios', async ({ page }) => {
    await page.goto('/eventos/2-acampamento');
    
    const btnVoluntario = page.getByRole('button', { name: 'Seja Voluntário' });
    await expect(btnVoluntario).toBeVisible();
    await btnVoluntario.click(); // Não deve fazer nada, cobre a branch if (event.link...)
  });

  test('deve cobrir as falhas (catch) no useEventDetails para schedule, gallery e speakers', async ({ page }) => {
    // Intercepta as chamadas auxiliares e falha de propósito
    await page.route('**/evento/*/atividade', async route => route.abort('failed'));
    await page.route('**/evento/*/galeria', async route => route.abort('failed'));
    await page.route('**/evento/*/participantes', async route => route.abort('failed'));

    await page.goto('/eventos/1-retiro-de-verao');

    // A página ainda carrega (evento 1), mas sem programação, palestrantes ou galeria
    await expect(page.getByRole('heading', { name: 'Retiro de Verão' })).toBeVisible();
    
    // As seções correspondentes não devem estar visíveis ou devem estar vazias
    await expect(page.getByRole('heading', { name: 'Programação do evento' })).not.toBeVisible();
  });

  test('deve cobrir falha geral no evento (catch fetchEventById)', async ({ page }) => {
    // Intercepta a chamada do evento principal e falha
    await page.route('**/evento/1', async route => route.abort('failed'));

    await page.goto('/eventos/1-retiro-de-verao');

    const tituloErro = page.getByRole('heading', { name: 'Evento não encontrado' });
    await expect(tituloErro).toBeVisible();
  });
});
