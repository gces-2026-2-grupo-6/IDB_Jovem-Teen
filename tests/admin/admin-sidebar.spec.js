import { test, expect } from '../helpers/testWithCoverage.js';
import { loginAsAdmin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Admin Sidebar e Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await setupApiMock(page);
    await page.goto('/admin');
  });

  test('deve exibir a sidebar no desktop com a logo e título', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const logo = sidebar.getByAltText('IDB Jovem & Teen');
    await expect(logo).toBeVisible();

    await expect(sidebar.getByText('Dashboard', { exact: true })).toBeVisible();
  });

  test('deve exibir todos os links de navegação na sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');

    await expect(sidebar.getByRole('link', { name: /Home/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /Eventos/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /Voluntários/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /Produtos/i })).toBeVisible();
    // o token do helper é superadmin, então vê Diretores & Líderes
    await expect(sidebar.getByRole('link', { name: /Diretores & Líderes/i })).toBeVisible();
  });

  test('deve realizar logout ao clicar no botão Sair', async ({ page }) => {
    const sidebar = page.locator('aside');
    const btnSair = sidebar.getByRole('button', { name: /Sair/i });

    await btnSair.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve exibir o menu mobile e a sidebar (MobileView)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const mobileHeader = page.locator('div').filter({ hasText: /^Painel Admin$/ }).first();
    await expect(mobileHeader).toBeVisible();

    // Abre a sidebar mobile
    const btnHamburger = mobileHeader.getByLabel('Abrir menu');
    await expect(btnHamburger).toBeVisible();
    await btnHamburger.click();

    // Sidebar deve ficar visível e conter botão fechar X
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const btnFechar = sidebar.locator('button').first();
    await expect(btnFechar).toBeVisible();

    await btnFechar.click();
    // Sidebar pode demorar a sumir por animação, entao valida se overlay sumiu
    const overlay = page.locator('div.fixed.inset-0.bg-black\\/50');
    await expect(overlay).not.toBeVisible();
  });
});
