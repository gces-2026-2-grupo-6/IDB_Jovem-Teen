import { test, expect } from '../helpers/testWithCoverage.js';
import { mockKeycloakLogin } from '../helpers/adminAuth';
import { setupApiMock } from '../helpers/apiMock';

test.describe('Fluxo Completo de Administração', () => {
  test('Fluxo completo: Login -> Dashboard -> Eventos -> Produtos -> Logout', async ({ page, isMobile }) => {
    /* Só desktop: o fluxo clica nos itens da barra lateral, que no celular
       fica recolhida atrás do botão "Abrir menu". O caminho pelo menu móvel
       é coberto em admin-mobile.spec.js. */
    test.skip(isMobile, 'barra lateral recolhida no celular');
    await mockKeycloakLogin(page);
    await setupApiMock(page);

    // 1. Tentar acessar admin sem estar logado
    await page.goto('/admin');
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/login/);

    // 2. Fazer login
    await page.getByPlaceholder('Digite seu usuário').fill('idbjovem');
    await page.getByPlaceholder('Digite sua senha').fill('idbjovem');
    await page.getByRole('button', { name: 'Login' }).click();

    // Deve redirecionar para dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // 3. Navegar para Eventos pelo Sidebar
    const sidebar = page.locator('aside');
    await sidebar.getByRole('link', { name: 'Eventos' }).click();
    await expect(page).toHaveURL(/\/admin\/eventos/);
    await expect(page.getByRole('heading', { name: 'Eventos', exact: true })).toBeVisible();

    // 4. Navegar para Voluntários pelo Sidebar
    await sidebar.getByRole('link', { name: 'Voluntários' }).click();
    await expect(page).toHaveURL(/\/admin\/voluntarios/);
    await expect(page.getByRole('heading', { name: 'Voluntários', exact: true })).toBeVisible();

    // 5. Navegar para Produtos pelo Sidebar
    await sidebar.getByRole('link', { name: 'Produtos' }).click();
    await expect(page).toHaveURL(/\/admin\/produtos/);
    await expect(page.getByRole('heading', { name: 'Produtos', exact: true })).toBeVisible();

    // 6. Fazer logout
    const btnSair = sidebar.getByRole('button', { name: 'Sair' });
    await btnSair.click();

    // Deve voltar para login
    await expect(page).toHaveURL(/\/login/);

    // 7. Tentar acessar admin de novo
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});
