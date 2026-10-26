import { test, expect } from '../helpers/testWithCoverage.js';
import { mockKeycloakLogin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Fluxos de Navegação Pública (Cross-page)', () => {
  test.beforeEach(async ({ page }) => {
    await mockKeycloakLogin(page);
    await setupApiMock(page);
  });
  test('Fluxo Home -> Eventos -> Detalhes -> Voltar -> Home', async ({ page, isMobile }) => {
    /* Só desktop: o fluxo usa a navegação do cabeçalho, que no celular fica
       dentro do menu móvel (coberto em header.spec.js). */
    test.skip(isMobile, 'navegação do cabeçalho recolhida no celular');
    // Inicia na Home
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Clica no link de "Eventos" no Header
    const nav = page.locator('nav').first();
    await nav.getByText('Eventos', { exact: true }).click();
    await expect(page).toHaveURL(/\/eventos/);

    // Na página de Eventos, clica no primeiro "Veja mais"
    const gridContainer = page.locator('section.pb-20 > div > div.grid');
    const primeiroCardLink = gridContainer.getByRole('link', { name: /Veja mais/i }).first();

    if (await primeiroCardLink.isVisible().catch(() => false)) {
      await primeiroCardLink.click();

      // Deve estar na página de Detalhes do Evento
      await expect(page).toHaveURL(/\/eventos\/[\w-]+/);
      const btnVoltar = page.getByLabel('Voltar');
      await expect(btnVoltar).toBeVisible();

      // Clica em Voltar
      await btnVoltar.click();
      await expect(page).toHaveURL(/\/eventos$/);
    }

    // 6. Volta para Home clicando na Logo
    await page.getByRole('link', { name: 'IDB Jovem & Teen' }).click();
    await expect(page).toHaveURL('/');
  });

  test('Fluxo Home -> Galeria -> Voltar', async ({ page }) => {
    // Inicia na Home
    await page.goto('/');

    // Vai para a Galeria através do link "Ver mais +" na seção de galeria
    const galeriaSection = page.locator('section').filter({ hasText: 'Galeria de fotos' });
    const btnVerMais = galeriaSection.getByRole('link', { name: /Ver mais \+/i });

    await btnVerMais.click();
    await expect(page).toHaveURL(/\/galeria/);

    // Na página de Galeria, testa o botão de voltar
    const btnVoltar = page.getByLabel('Voltar');
    await btnVoltar.click();

    // Deve retornar para a home
    await expect(page).toHaveURL('/');
  });

  test('Fluxo Home -> Eventos Próximos -> Voltar', async ({ page }) => {
    // Inicia na Home
    await page.goto('/');

    // Vai para Eventos Próximos através do Header Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    const btnProxEventos = page.getByRole('button', { name: /Eventos próximos/i });

    await btnProxEventos.click();
    await expect(page).toHaveURL(/\/eventos-proximos/);

    // Na página de Eventos Próximos, testa o botão de voltar
    const btnVoltar = page.getByLabel('Voltar');
    await btnVoltar.click();

    // Deve retornar para a home
    await expect(page).toHaveURL('/');
  });

  test('Acessar rota admin sem auth e fazer login', async ({ page }) => {
    // Tentar acessar admin
    await page.goto('/admin/eventos');

    // Deve ser redirecionado para /login
    await expect(page).toHaveURL(/\/login/);

    // Preencher login válido
    await page.getByPlaceholder('Digite seu usuário').fill('idbjovem');
    await page.getByPlaceholder('Digite sua senha').fill('idbjovem');
    await page.getByRole('button', { name: 'Login' }).click();

    // Redirecionamento após login deve levar para dashboard, pois a rota original não é lembrada neste front
    await expect(page).toHaveURL(/\/admin/);
  });
});
